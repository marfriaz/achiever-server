const TasksService = {
  getAllTasks(knex) {
    return knex.select("*").from("tasks");
  },

  insertTask(knex, newTask) {
    return knex
      .insert(newTask)
      .into("tasks")
      .returning("*")
      .then((rows) => {
        return rows[0];
      });
  },

  getById(knex, id) {
    return knex.from("tasks").select("*").where("id", id).first();
  },

  deleteTask(knex, id) {
    return knex("tasks").where({ id }).delete();
  },

  updateTask(knex, id, newTaskField) {
    return knex("tasks").where({ id }).update(newTaskField);
  },
};

module.exports = TasksService;
