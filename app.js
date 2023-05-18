const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
    try {
        database = await open({
            filename: databasePath,
            driver: sqlite3.Database,
        });
        app.listen(3000, () =>
            console.log("Server Running at http://localhost:3000/")
        );
    } catch (error) {
        console.log(`DB Error: ${error.message}`);
        process.exit(1);
    }
};

initializeDbAndServer();
const hasPriorityAndStatusProperties = (requestQuery) => {
    return (
        requestQuery.priority !== undefined && requestQuery.status !== undefined
    );
};

const hasPriorityProperty = (requestQuery) => {
    return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
    return requestQuery.status !== undefined;
};
app.get("/todos/", async (request, response) => {
    let data = null;
    let getTodosQuery = "";
    const { search_q = "", priority, status } = request.query;

    switch (true) {
        case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
            getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`;
            break;
        case hasPriorityProperty(request.query):
            getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`;
            break;
        case hasStatusProperty(request.query):
            getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`;
            break;
        default:
            getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
    }

    data = await database.all(getTodosQuery);
    response.send(data);
});
const convertDbObjectToResponseObject = (dbObject) => {
    return {
        id: dbObject.id,
        todo: dbObject.todo,
        priority: dbObject.priority,
        status: dbObject.status,
    };
};

app.get("/todos/:todoId", async (request, response) => {
    const { todoId } = request.params
    const getTodoQuery = `
    SELECT
      *
    FROM
      todo
      WHERE id=${todoId};`;
    const todosArray = await database.get(getTodoQuery);
    response.send(convertDbObjectToResponseObject(eachPlayer));
});
app.post("/todos/", async (request, response) => {
    const { todo, priority, status } = request.body;
    const postTodoQuery = `
  INSERT INTO
    todo (todo, priority, status)
  VALUES
    ('${todo}', ${priority}, '${status}');`;
    const todoitem = await database.run(postTodoQuery);
    response.send("Todo Successfully Added");
});
app.put("/todos/:todoId/", async (request, response) => {
    const { todoid } = request.params
    let updatecolumn = "";
    const requestbody = request.body
    switch (true) {
        case requestbody.status !== undefined:
            updatecolumn = "Status"
            break
        case requestbody.priority !== undefined:
            updatecolumn = "Priority"
            break
        case requestbody.todo !== undefined:
            updatecolumn = "Todo"
            break
    }
    const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
      WHERE id=${todoid};`;
    const previousTodo = await database.get(previousTodoQuery);
    const { todo = previousTodo.todo,
        status = previousTodo.status,
        priority = previousTodo.priority } = request.body
    const updateTodoQuery = `
  UPDATE
    todo
  SET
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
  WHERE
    id = ${todoid};`;

    await database.run(updateTodoQuery);
    response.send(`${updatecolumn} Updated`);
});
app.delete("/todos/:todoId/", async (request, response) => {
    const { todoId } = request.params;
    const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;
    await database.run(deleteTodoQuery);
    response.send("Todoc Removed");
});
module.exports = app;