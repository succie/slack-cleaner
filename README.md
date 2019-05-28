# slack-cleaner

## Description

この Bot が参加しているチャンネルで  
`maxMessageNumber` を超えたメッセージ数がある場合に  
溢れた分のメッセージ古い順に削除する

## Usages

1. `config/default.sample.json` を `config/default.json` に変更
1. `token` にそれぞれ Bot User Oauth Access Token, OAuth Access Token を設定
   - 以下の Scope を持つ必要があります
     - admin
     - channels:histroy
     - chat:write:user
     - files:write:user
     - bot
1. `default.maxMessageNumber` を設定
1. `default.files` を `true` にした場合, 投稿されたファイルも一緒に削除します
1. チャンネル毎に `maxMessageNumber` を指定したい場合は, `channels` に設定
1. `npm install` で依存ライブラリをインストール
1. `npm start` で実行
