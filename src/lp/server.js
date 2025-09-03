const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

// 静的ファイルの配信
app.use(express.static(path.join(__dirname, "lp_dist")));

// SPA用のルーティング（全てのリクエストをindex.htmlに）
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "lp_dist", "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
