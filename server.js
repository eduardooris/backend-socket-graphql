const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const { graphqlHTTP } = require("express-graphql");
const { buildSchema } = require("graphql");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

app.use(cors());

const schema = buildSchema(`
  type Query {
    hello: String
  }
  type Mutation {
    sendMessage(clientId: String!, message: String!): String
  }
`);

const root = {
  hello: () => "Hello world!",
  sendMessage: ({ clientId, message }) => {
    io.to(clientId).emit("message", message);
    return "Message sent!";
  },
};

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);

io.on("connection", (socket) => {
  const clientId = socket.handshake.query.clientId;
  console.log(`Client connected: ${socket.id}, ${clientId}`);
  socket.join(clientId);
  socket.on("disconnect", (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
  });
});

const PORT = 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
