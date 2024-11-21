cd /client
npm i

cd /server
npm i

cd /server/db
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all

npm start in client
node index.js in server
