---
name: develop-with-approval
description: リポジトリ内の機能追加、バグ修正、リファクタリング、設定変更、依存更新、DB変更など、ファイルやGit状態を変更する開発タスクで使用する。関連コードを調査し、実装計画を提示して明示的な承認を待ち、承認後にローカルbranch作成、実装、検証、自己レビュー、ローカルcommit、ローカル引き渡しまで進める。GitHub、remote、push、PRは使用しない。ユーザーが最初から承認不要または直ちに実装してよいと明示した場合を除き、軽微な変更にも使用する。
---

# 承認付き開発ワークフロー

リポジトリの `AGENTS.md` を先に読み、その規約を優先する。調査と計画を実装から分離し、承認された範囲だけを変更する。

## 承認前

1. 要求、完了条件、対象外、重大な不明点を整理する。コードから合理的に推測できる事項は前提として明記する。
2. `git status --short --branch`、指示ファイル、README、package.json、設定、CI、関連ソース、テスト、ドキュメントを読み取る。
3. `rg` と `rg --files` を優先し、呼び出し元、依存先、類似実装、テストを追跡する。
4. UI、ロジック、データ取得、API、DBの責務と依存方向を把握する。秘密情報は値を読まず、存在確認に留める。
5. `references/implementation-plan-template.md` を読み、承認依頼を作成する。

承認前はファイル変更、生成物作成、キャッシュを書き得る検証、branch操作、依存操作、migration、commit、remote操作を行わない。

## 承認

提示した計画への明確な実装許可、または初回依頼での「承認不要」「そのまま実装してよい」という明示指示だけを承認として扱う。曖昧な返答を推測しない。

承認後に変更範囲、依存追加、migration、外部操作が重大に変わる場合は、更新計画を示して再承認を得る。本番変更とデプロイは常に別途明示承認を得る。

## 承認後の実装

1. Git状態を再確認し、ユーザーの未コミット変更を上書き、破棄、自動stashしない。
2. 計画に沿って作業branchを作成する。規約がなければ `<type>/<short-kebab-summary>` を使う。
3. 既存の設計、命名、責務分離、依存方向を維持して小さく実装する。
4. UI、ロジック、データ取得を分離し、Reactのロジックはhooksへ置く。API呼び出しをcomponentへ直接書かない。
5. `any` を使わず、外部入力と永続化データをruntime validationする。mutation成功時は関連queryをinvalidateする。
6. 計画外の依存追加、migration、破壊的変更が必要になったら停止して承認を得る。
7. 正常系、境界値、異常系、回帰リスクをテストする。

## 検証と自己レビュー

変更範囲に応じて `package.json` のコマンドを実行する。

- TypeScript/React/サーバー: `npm run format:check`、`npm run lint`、`npm run typecheck`、`npm run test:run`、`npm run build`
- UI/Story: 上記に加え `npm run test:storybook`、必要なら `npm run build-storybook`
- DB: schemaと生成migrationを確認する。`db:generate` は計画済みの場合だけ実行し、`db:migrate` と `db:push` は対象環境を含む明示承認なしに実行しない
- 文書/Skillのみ: `git diff --check` と対象固有の検証を行い、無関係なアプリ検証を省略した理由を記録する

失敗を成功扱いにしない。実行できない場合は原因、試した内容、未確認項目を記録する。

`git status --short`、`git diff --check`、`git diff` を確認し、`references/self-review-checklist.md` の該当項目を確認する。問題を見つけたら修正、再検証、差分全体の再レビューを行う。

## コミットとローカル引き渡し

作業前に `git log --oneline --decorate` と差分を確認し、不要なcheckpoint commitを作らない。自分が変更したパスだけを明示してstageし、`git diff --cached` を確認してからローカルcommitする。規約がなければ短い命令形の件名を使い、必要に応じて `feat:`、`fix:`、`refactor:`、`test:`、`docs:`、`chore:` を付ける。

`git fetch`、`git pull`、`git push`、`gh`、PR作成・閲覧・コメントなど、GitHubまたはremoteと通信する操作を実行しない。`references/local-handoff-template.md` を実際の差分と検証結果で埋め、branch名、commit hash、`git diff <base-branch>...HEAD` を最終報告へ記載する。mergeはユーザーが明示的に依頼した場合だけ行う。

merge後は不要になったローカル作業branchを `git branch -d` で削除し、必要なら staleなlocal remote-tracking refも削除する。commitの削除、squash、rebaseは、対象と影響を示した明示的承認なしに行わない。

## 最終報告

実装内容、設計判断、主要ファイル、検証結果、自己レビューで修正した事項、branch、commit、ローカル差分確認方法、cleanupしたbranch/ref、未実施項目と制約を簡潔に報告する。
