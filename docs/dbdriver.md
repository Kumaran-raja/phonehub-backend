You don’t need to install **all three database drivers at once**. That would be redundant. You only need the driver(s) for the database(s) you actually plan to use.

Here’s the **correct way**:

---

### 1️⃣ TypeORM + MySQL

```bash
npm install typeorm mysql2 reflect-metadata
npm install -D @types/node
```

---

### 2️⃣ TypeORM + MariaDB

```bash
npm install typeorm mariadb reflect-metadata
npm install -D @types/node
```

---

### 3️⃣ TypeORM + PostgreSQL

```bash
npm install typeorm pg reflect-metadata
npm install -D @types/node
```

---

### ✅ Notes

* You **only need one of the database installs** depending on what you use.
* `reflect-metadata` is required for TypeORM.
* `@types/node` is only needed for TypeScript typing.

---

Since your `.env` says `DB_ENGINE=mysql`, you should run **only**:

```bash
npm install typeorm mysql2 reflect-metadata
npm install -D @types/node
```

After that, restart your IDE, and `import { DataSource } from "typeorm"` should work without the “Cannot find module” error.

---

If you want, I can give you a **ready-to-use `db.ts` and user model** fully configured for MySQL with your JWT auth system.

Do you want me to do that?
