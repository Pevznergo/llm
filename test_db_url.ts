require('dotenv').config({ path: '.env.local' });
console.log("DATABASE_URL Server Side is:", process.env.DATABASE_URL ? "Defined" : "UNDEFINED");
