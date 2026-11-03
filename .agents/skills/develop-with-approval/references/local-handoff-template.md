# 作業完了報告テンプレート

確認モードと PRモードで使い分ける。`AGENTS.md` の作業モードに従う。

## 確認モード

編集・検証のみ。commit / push / PR は行わない。

### 変更ファイル

- （パス一覧）

### git diff の要点

- （ユーザーがレビューしやすい要約）

### 実行したテスト・検証

- 実行したコマンドと結果
- 未実施項目と理由

### 次にどうするか

- PRモードへ進むか、追加修正が必要か

## PRモード（引き渡し）

### 背景と目的

### 主な変更内容

### 設計上の判断

### 影響範囲

### 実行したテスト・検証

- CI相当（PR作成・更新前に必須）: `npm run format:check && npm run check && npm run test:run && npm run build`
- その他実行したコマンドと結果
- 未実施項目と理由

### 手動確認

### Git / PR 情報

- ベースbranch:
- 作業branch:
- commit:
- PR URL:
- 差分確認: `git diff <base-branch>...<work-branch>`

merge はユーザーが行う（`main` / `staging` への直接 push・merge はエージェントが行わない）。

### 残っている課題・制約
