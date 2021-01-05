const GoalsService = {
  getAllGoals(knex) {
    return knex.select("*").from("goals");
  },

  insertGoal(knex, newGoal) {
    return knex
      .insert(newGoal)
      .into("goals")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex.from("goals").select("*").where("id", id).first();
  },

  deleteGoal(knex, id) {
    return knex("goals").where({ id }).delete();
  },

  updateGoal(knex, id, newGoalField) {
    return knex("goals").where({ id }).update(newGoalField);
  },
};

module.exports = GoalsService;
