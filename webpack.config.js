const path = require("path");

module.exports = {
  entry: path.join(__dirname, "src/index.ts"),
  output: {
    path: path.join(__dirname, "dist"),
    filename: "index.js",
    libraryTarget: "commonjs"
  },
  target: "node",
  mode: "production",
  resolve: {
    extensions: [".js", ".ts"]
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          {
            loader: "babel-loader",
            options: {
              presets: [["@babel/preset-env", { targets: { node: "10" } }]]
            }
          },
          "ts-loader"
        ]
      }
    ]
  }
};
