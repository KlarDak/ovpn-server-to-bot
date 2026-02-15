import sqlite3 from "sqlite3";

class SQLiteClient {
    db: sqlite3.Database;

    constructor(dbFile: string) {
        this.db = new sqlite3.Database(dbFile, (err) => {
            if (err) console.error("DB connect error:", err.message);
        });
    } 

    // универсальный run (INSERT/UPDATE/DELETE)
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

    // получить одну запись
    get(sql: string, params: any[] = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err: any, row: any) => {
                if (err) return reject(err);
                resolve(row);
            });
        });
    }

    // получить массив записей
    all(sql: string, params: any[] = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err: any, rows: any[]) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
    }

    // CREATE
    async create(table: string, data: any) {
        const keys = Object.keys(data);
        const placeholders = keys.map(() => "?").join(",");

        const sql = `
          INSERT INTO ${table} (${keys.join(",")})
          VALUES (${placeholders})
        `;

        return this.run(sql, Object.values(data));
    }

    // READ
    async read(table: string, where = "", params: Array<any> = []) {
        const sql = `SELECT * FROM ${table} ${where}`;
        return this.all(sql, params);
    }

    // UPDATE
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

    // DELETE
    async delete(table: string, where: string, params: Array<any> = []) {
        const sql = `DELETE FROM ${table} ${where}`;
        return this.run(sql, params);
    }

  close() {
      this.db.close();
  }
}

export default SQLiteClient;