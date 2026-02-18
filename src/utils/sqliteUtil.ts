import sqlite3 from "sqlite3";

/**
 * A utility class for interacting with a SQLite database, providing methods for executing SQL queries and performing CRUD operations on the database. The class establishes a connection to the specified SQLite database file upon instantiation, and provides methods for running SQL queries, retrieving single or multiple records, and performing create, read, update and delete operations on the database tables. The class also includes error handling for database operations, logging any errors that occur during query execution or connection establishment.
 */
class SQLiteClient {
    db: sqlite3.Database;

    /**
     * Create a new instance of the SQLiteClient class, which establishes a connection to the specified SQLite database file. If the connection is successful, the database object is stored in the instance for later use. If an error occurs during the connection, it is logged to the console.
     * @param dbFile - path to the SQLite database file to which the connection should be established
     */
    constructor(dbFile: string) {
        this.db = new sqlite3.Database(dbFile, (err) => {
            if (err) console.error("DB connect error:", err.message);
        });
    } 

    /**
     * Execute the given SQL query with the specified parameters, and return a promise that resolves with the result of the query. If an error occurs during query execution, the promise is rejected with the error.
     * @param sql - SQL query to be executed on the database, which can include placeholders for parameters
     * @param params - array of parameters to be substituted into the SQL query placeholders, which can be empty if the query does not require parameters
     * @returns Promise - a promise that resolves with the result of the SQL query if execution is successful, or rejects with an error if execution fails
     */
    run(sql: string, params: any[] = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (err: any) {
                if (err) return reject(err);
                resolve({
                    lastID: this.lastID,
                    changes: this.changes,
                });
            });
        });
    }

    /**
     * Retrieve a single record from the database by executing the given SQL query with the specified parameters, and return a promise that resolves with the retrieved record. If an error occurs during query execution, the promise is rejected with the error.
     * @param sql - SQL query to be executed on the database, which can include placeholders for parameters
     * @param params - array of parameters to be substituted into the SQL query placeholders, which can be empty if the query does not require parameters
     * @returns Promise - a promise that resolves with the retrieved record if query execution is successful, or rejects with an error if execution fails
     */
    get(sql: string, params: any[] = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err: any, row: any) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    /**
     * Retrieve multiple records from the database by executing the given SQL query with the specified parameters, and return a promise that resolves with the retrieved records. If an error occurs during query execution, the promise is rejected with the error.
     * @param sql - SQL query to be executed on the database, which can include placeholders for parameters
     * @param params - array of parameters to be substituted into the SQL query placeholders, which can be empty if the query does not require parameters
     * @returns Promise - a promise that resolves with the retrieved records if query execution is successful, or rejects with an error if execution fails
     */
    all(sql: string, params: any[] = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: any, rows: any[]) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    /**
     * Perform a create operation on the specified table with the given data, by constructing and executing an SQL INSERT query. The method returns a promise that resolves with the result of the query execution, which includes the last inserted ID and the number of changes made to the database. If an error occurs during query execution, the promise is rejected with the error.
     * @param table - name of the database table on which the create operation should be performed
     * @param data - object containing the data to be inserted into the specified table, where the keys represent the column names and the values represent the corresponding values to be inserted
     * @returns Promise - a promise that resolves with the result of the SQL INSERT query execution if successful, or rejects with an error if execution fails
     */
    async create(table: string, data: any) {
        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(",");

        const sql = `
          INSERT INTO ${table} (${keys.join(",")})
          VALUES (${placeholders})
        `;

        return this.run(sql, Object.values(data));
    }

    /**
     * Perform a read operation on the specified table with the given conditions, by constructing and executing an SQL SELECT query. The method returns a promise that resolves with the retrieved records that match the specified conditions. If an error occurs during query execution, the promise is rejected with the error.
     * @param table - name of the database table from which records should be retrieved
     * @param where - optional string representing the conditions for filtering the records to be retrieved, which can include placeholders for parameters
     * @param params - array of parameters to be substituted into the SQL query placeholders in the where clause, which can be empty if the where clause does not require parameters
     * @return Promise - a promise that resolves with the retrieved records that match the specified conditions if query execution is successful, or rejects with an error if execution fails
     */
    async read(table: string, where = "", params: Array<any> = []) {
        const sql = `SELECT * FROM ${table} ${where}`;
        return this.all(sql, params);
    }

    /**
     * Perform an update operation on the specified table with the given data and conditions, by constructing and executing an SQL UPDATE query. The method returns a promise that resolves with the result of the query execution, which includes the number of changes made to the database. If an error occurs during query execution, the promise is rejected with the error.
     * @param table - name of the database table on which the update operation should be performed
     * @param data - object containing the data to be updated in the specified table, where the keys represent the column names and the values represent the corresponding values to be updated
     * @param where - string representing the conditions for filtering the records to be updated, which can include placeholders for parameters
     * @param params - array of parameters to be substituted into the SQL query placeholders in the where clause, which can be empty if the where clause does not require parameters
     * @returns Promise - a promise that resolves with the result of the SQL UPDATE query execution if successful, or rejects with an error if execution fails
     */
    async update(table: string, data: any, where: string, params: Array<any> = []) {
        const keys = Object.keys(data);
        const set = keys.map((k) => `${k}=?`).join(",");

        const sql = `
          UPDATE ${table}
          SET ${set}
          ${where}
        `;

        return this.run(sql, [...Object.values(data), ...params]);
    }

    /**
     * Perform a delete operation on the specified table with the given conditions, by constructing and executing an SQL DELETE query. The method returns a promise that resolves with the result of the query execution, which includes the number of changes made to the database. If an error occurs during query execution, the promise is rejected with the error.
     * @param table - name of the database table from which records should be deleted
     * @param where - string representing the conditions for filtering the records to be deleted, which can include placeholders for parameters
     * @param params - array of parameters to be substituted into the SQL query placeholders in the where clause, which can be empty if the where clause does not require parameters
     * @returns Promise - a promise that resolves with the result of the SQL DELETE query execution if successful, or rejects with an error if execution fails
     */
    async delete(table: string, where: string, params: Array<any> = []) {
        const sql = `DELETE FROM ${table} ${where}`;
        return this.run(sql, params);
    }

  close() {
      this.db.close();
  }
}

export default SQLiteClient;