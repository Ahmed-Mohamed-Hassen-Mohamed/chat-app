const mongoose = require("mongoose");
mongoose
  .connect(process.env.DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database");
  })
  .catch((error) => {
    console.error("Database connection error:", error);
  });

  // mongodb+srv://am5757:XZzmHx6i7p24t5An@cluster0.cmr04hq.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0