const path = require("path");
const express = require("express");
const xss = require("xss");
const GoalsService = require("./goals-service");

const goalsRouter = express.Router();
const jsonParser = express.json();

const serializeGoal = (goal) => ({
  id: goal.id,
  name: xss(goal.name),
});

goalsRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    GoalsService.getAllGoals(knexInstance)
      .then((goals) => {
        res.json(goals.map(serializeGoal));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { name } = req.body;
    const newGoal = { name };

    for (const [key, value] of Object.entries(newGoal))
      if (value == null)
        return res.status(400).json({
          error: {
            message: `Missing '${key}' in request body`,
          },
        });

    GoalsService.insertGoal(req.app.get("db"), newGoal)
      .then((goal) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${goal.id}`))
          .json(serializeGoal(goal));
      })
      .catch(next);
  });

goalsRouter
  .route("/:goal_id")
  .all((req, res, next) => {
    GoalsService.getById(req.app.get("db"), req.params.goal_id)
      .then((goal) => {
        if (!goal) {
          return res.status(404).json({
            error: { message: `Goal doesn't exist` },
          });
        }
        res.goal = goal;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeGoal(res.goal));
  })
  .delete((req, res, next) => {
    GoalsService.deleteGoal(req.app.get("db"), req.params.goal_id)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { name } = req.body;
    const goalToUpdate = { name };

    const numberOfValues = Object.values(goalToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must content 'name'`,
        },
      });

    GoalsService.updateGoal(req.app.get("db"), req.params.goal_id, goalToUpdate)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = goalsRouter;
