const path = require("path");
const express = require("express");
const xss = require("xss");
const TasksService = require("./tasks-service");

const tasksRouter = express.Router();
const jsonParser = express.json();

const serializeTask = (task) => ({
  id: task.id,
  goal_id: task.goal_id,
  name: xss(task.name),
  details: xss(task.details),
  date_created: task.date_created,
});

tasksRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    TasksService.getAllTasks(knexInstance)
      .then((tasks) => {
        res.json(tasks.map(serializeTask));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { goal_id, name, details, date_created } = req.body;
    const newTask = { goal_id, name, details };

    for (const [key, value] of Object.entries(newTask))
      if (value == null)
        return res.status(400).json({
          error: {
            message: `Missing '${key}' in request body`,
          },
        });

    TasksService.insertTask(req.app.get("db"), newTask)
      .then((task) => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${task.id}`))
          .json(serializeTask(task));
      })
      .catch(next);
  });

tasksRouter
  .route("/:task_id")
  .all((req, res, next) => {
    TasksService.getById(req.app.get("db"), req.params.task_id)
      .then((task) => {
        if (!task) {
          return res.status(404).json({
            error: { message: `Task doesn't exist` },
          });
        }
        res.task = task;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeTask(res.task));
  })
  .delete((req, res, next) => {
    TasksService.deleteTask(req.app.get("db"), req.params.task_id)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  })
  .patch(jsonParser, (req, res, next) => {
    const { goal_id, name, details } = req.body;
    const taskToUpdate = { goal_id, name, details };

    const numberOfValues = Object.values(taskToUpdate).filter(Boolean).length;
    if (numberOfValues === 0)
      return res.status(400).json({
        error: {
          message: `Request body must contain 'content', 'goal_id', 'name' and 'details`,
        },
      });

    TasksService.updateTask(req.app.get("db"), req.params.task_id, taskToUpdate)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = tasksRouter;
