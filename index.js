const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 4000;

app.use(express.json());
app.use(cors());
const bcrypt = require("bcrypt");
const saltRounds = 10;
const salt = bcrypt.genSaltSync(saltRounds);

const knex = require("knex")({
  client: "pg",
  connection: {
    host: "127.0.0.1",
    port: 5432,
    user: "rayhan12",
    database: "redditClone",
  },
});

app.get("/", (req, res) => {
  res.status(200).send("connected");
});

app.post("/register", (req, res) => {
  // res.status(200).send("connected");
  console.log(req.body.password);

  let hashedPassword = bcrypt.hashSync(req.body.password, salt);

  knex("users")
    .returning("*")
    .insert({
      user_email: req.body.email,
      user_password: hashedPassword,
      user_name: req.body.name,
    })
    .then((db) => {
      res.send(db);
    })
    .catch((err) => {
      res.status(404).send("unable to register user");
    });

  // knex("users")
  //   .insert({
  //     user_email: req.body.email,
  //     user_password: hashedPassword,
  //     user_name: req.body.name,
  //   })
  //   .then((db) => {
  //     return knex("users");
  //   })
  //   .then((re) => {
  //     res.send(re);
  //   })
  //   .catch((err) => {
  //     res.status(404).send("unable to register");
  //   });
});

app.post("/signin", (req, res) => {
  knex("users")
    .where({
      user_email: req.body.email,
    })
    .select("user_password")
    .then((db) => {
      let isValid = bcrypt.compareSync(req.body.password, db[0].user_password);
      console.log(isValid);
      console.log(db[0].user_password);
      console.log(req.body.password);
      if (isValid) {
        return knex("users")
          .where({
            user_email: req.body.email,
          })
          .select("id", "user_email", "user_name");
      } else {
        res.status(404).send("wrong password");
      }
    })
    .then((db) => {
      res.send(db);
    })
    .catch(() => {
      res.status(404).send("unable to sign in");
    });

  console.log(req.body);
});

app.post("/thread", (req, res) => {
  knex("threads")
    .returning("*")
    .insert({
      thread_title: req.body.title,
      thread_body: req.body.body,
      user_id: req.body.id,
    })
    .then((db) => {
      res.send(db);
    })
    .catch((err) => {
      res.status(404).send("unable to create thread");
    });

  console.log(req.body);
});

app.post("/comment", (req, res) => {
  knex("comments")
    .returning("*")
    .insert({
      comment_body: req.body.comment,
      user_id: req.body.user_id,
      thread_id: req.body.thread_id,
    })
    .then((db) => {
      res.send(db);
    })
    .catch((err) => {
      res.status(404).send("unable to create thread");
    });
});

app.get("/comments/:id", (req, res) => {
  // knex("comments")
  //   .where({
  //     thread_id: req.params.id,
  //   })
  //   .select("*")
  //   .then((db) => {
  //     res.send(db);
  //   })
  //   .catch((err) => {
  //     res.status(404).send("comments not found");
  //   });

  knex
    .select("*")
    .from("comments")
    .fullOuterJoin("users", "comments.user_id", "users.id")
    .where("thread_id", req.params.id)
    .then((db) => {
      res.send(db);
    })
    .catch((err) => {
      res.status(404).send("unable to retrieve thread");
    });
});

app.put("/comments/:id", (req, res) => {
  knex("threads")
    .where("id", req.params.id)
    .update({
      thread_comment_amount: req.body.comment_amount,
    })
    .returning("*")
    .then((db) => {
      res.send(db);
    });

  console.log(req.params);
  console.log(req.body.comment_amount);
});
app.get("/thread/:id", (req, res) => {
  // knex("threads")
  //   .where({
  //     id: req.params.id,
  //   })
  //   .select("*")
  //   .then((db) => {
  //     res.send(db);
  //   })
  //   .catch((err) => {
  //     res.status(404).send("thread not found");
  //   });

  //  knex("threads")
  //    .where({
  //      id: req.params.id,
  //    })
  //    .select("*")
  //    .then((db) => {
  //      res.send(db);
  //    })
  //    .catch((err) => {
  //      res.status(404).send("thread not found");
  //    });

  knex
    .select("*")
    .from("threads")
    .fullOuterJoin("users", "threads.user_id", "users.id")
    .where("threads.id", req.params.id)
    .then((db) => {
      res.send(db);
    })
    .catch((err) => {
      res.status(404).send("unable to retrieve thread");
    });
});

app.get("/allthreads", (req, res) => {
  // knex("threads")
  //   .orderBy("created_at", "desc")
  //   .then((db) => {
  //     res.send(db);
  //   });

  knex
    .select(
      "users.user_name",
      "threads.id",
      "threads.thread_title",
      "threads.thread_body	",
      "threads.thread_upvotes",
      "threads.thread_downvotes",
      "threads.thread_comment_amount",
      "threads.created_at"
    )
    .from("threads")
    .leftJoin("users", "threads.user_id", "users.id")
    .orderBy("threads.created_at", "desc")
    .then((db) => {
      res.send(db);
    })
    .catch((err) => {
      res.status(404).send("unable to retrieve thread");
    });
});

app.post("/replies", (req, res) => {
  knex("replies")
    .returning("*")
    .insert({
      reply_body: req.body.reply,
      user_id: req.body.replier_id,
      thread_id: req.body.thread_id,
      comment_id: req.body.comment_id,
    })
    .then((db) => {
      res.send(db);
    })
    .catch((err) => {
      res.status(404).send("unable to register user");
    });
});

app.get("/allreplies/:id", (req, res) => {
  // knex("replies")
  //   .where({
  //     comment_id: req.params.id,
  //   })
  //   .select("*")
  //   .then((db) => {
  //     res.send(db);
  //   })
  //   .catch((err) => {
  //     res.status(404).send("no replies");
  //   });

  knex
    .select("*")
    .from("replies")
    .leftJoin("users", "replies.user_id", "users.id")
    .where({
      comment_id: req.params.id,
    })
    .orderBy("created_at", "desc")
    .then((db) => {
      res.send(db);
    })
    .catch((err) => {
      res.status(404).send("unable to retrieve thread");
    });
});

app.get("/likes/:email", (req, res) => {
  knex
    .select("*")
    .from("likedthreads")
    .where({ user_email: req.params.email })
    .then((db) => {
      res.send(db);
    })
    .catch(() => {
      res.status(404).send("user likes not found");
    });
});

app.post("/likes", (req, res) => {
  const {
    thread_id,
    thread_title,
    thread_admin,
    user_email,
    created_at,
    thread_comments,
  } = req.body;
  knex("likedthreads")
    .insert({
      thread_id: thread_id,
      thread_title,
      thread_title,
      thread_admin,
      thread_admin,
      user_email,
      user_email,
      created_at,
      created_at,
      thread_comments,
    })
    .then((db) => {
      return knex("likedthreads").select("*").where("user_email", user_email);
    })
    .then((db) => {
      res.send(db);
    });
  console.log(req.body);
});

app.delete("/likes", (req, res) => {
  knex("likedthreads")
    .where({
      user_email: req.body.email,
      thread_id: req.body.thread_id,
    })
    .del()
    .then((db) => {
      return knex("likedthreads")
        .select("*")
        .where("user_email", req.body.email);
    })
    .then((db) => {
      res.send(db);
    });
});
// app.post("/user-likes", (req, res) => {
//   knex("users_likes_thread")
//     .insert({
//       user_id: req.body.userId,
//       thread_id: req.body.threadId,
//       like_type: req.body.likeType,
//     })
//     .then((db) => {
//       return knex("users_likes_thread").select("*");
//     })
//     .then((likes) => {
//       res.send(likes);
//     })
//     .catch((err) => {
//       res.status(404).send("unable to add like type");
//     });
// });

// app.put("/user-likes/:threadId", (req, res) => {
//   if (req.body.like_type == "dislike") {
//     knex("users_likes_thread")
//       .where({
//         thread_id: req.params.threadId,
//         user_id: req.body.user_id,
//       })
//       .update({
//         like_type: 1,
//       })
//       .then((db) => {
//         return knex("users_likes_thread").select("*");
//       })
//       .then((db) => {
//         res.send(db);
//       });
//   } else if (req.body.like_type == "like") {
//     knex("users_likes_thread")
//       .where({
//         thread_id: req.params.threadId,
//         user_id: req.body.user_id,
//       })
//       .update({
//         like_type: 0,
//       })
//       .then((db) => {
//         return knex("users_likes_thread").select("*");
//       })
//       .then((db) => {
//         res.send(db);
//       });
//   }

//   console.log(req.body);
// });
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
