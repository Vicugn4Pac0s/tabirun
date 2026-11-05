---
name: develop-with-approval
description: リポジトリ内の機能追加、バグ修正、リファクタリング、設定変更、依存更新、DB変更など、ファイルやGit状態を変更する開発タスクで使用する。関連コードを調査し、実装計画を提示して明示的な承認を待ち、承認後に実装、検証、自己レビューまで進める。PRモードのときは作業branch作成、commit、push、指定されたベース向けPR作成まで進める。AGENTS.md の作業モード・承認ゲート・Git・検証コマンドを優先する。
---

# 承認付き開発ワークフロー

リポジトリの `AGENTS.md` を先に読み、その規約（作業モード、承認ゲート、Git、セキュリティ、実装規約）を優先する。本 Skill は調査・計画・実装手順とテンプレートに集中する。実装規約の適用は今回追加・変更するコードに限定し、既存コードの違反は「気づいた点」として報告する。「確認する」は確認と結果報告までとし、規約や確認結果を根拠に範囲外の実装・テスト・Story追加を行わない。必要な対応は提案して指示を待つ。承認・セキュリティ・Git操作のルールは作業全体に適用する。

## 承認前

1. 要求、完了条件、対象外、重大な不明点を整理する。コードから合理的に推測できる事項は前提として明記する。
2. `git status --short --branch`、指示ファイル、README、package.json、設定、CI、関連ソース、テスト、ドキュメントを読み取る。
3. `rg` と `rg --files` を優先し、呼び出し元、依存先、類似実装、テストを追跡する。
4. UI、ロジック、データ取得、API、DBの責務と依存方向を把握する。秘密情報は値を読まず、存在確認に留める。
5. `references/implementation-plan-template.md` を読み、承認依頼を作成する。

承認前はファイル変更、生成物作成、キャッシュを書き得る検証、branch操作、依存操作、migration、commit、push、PR作成を行わない。ただし `AGENTS.md` の承認ゲートで計画提示を省略できるケース（明示承認、Cloud Agent 起動指示、typo・文言・コメントのみ）はその限りではない。

## 承認

提示した計画への明確な実装許可、または初回依頼での「承認不要」「そのまま実装してよい」、Cloud Agent 起動指示での具体的な完了条件だけを承認として扱う。曖昧な返答を推測しない。

依存の追加・更新、schema変更・migration生成、`src/env.js` 変更、範囲外の変更、削除・履歴書き換えは、計画省略条件にかかわらず対象と影響を示して個別に承認を得る。承認済みの対象・影響が重大に変わる場合は、更新計画を示して再承認を得る。本番DB・Preview DB、デプロイ、Vercel/Supabase/Google Cloud 設定は常に別途明示承認を得る。

## 承認後の実装

1. Git状態を再確認し、ユーザーの未コミット変更を上書き、破棄、自動stashしない。
2. **PRモード**では依頼に合わせてベースを `main` または `staging`（未指定なら `main`）に決め、作業開始前に `git fetch origin` を行い、最新の `origin/<ベース>` から作業branchを作成する。staging向けでは、分岐前に `AGENTS.md` のGitルールに従ってmainの未取り込みを確認し、未取り込みがあれば同期するか現状で進めるかの指示を待つ。staging で確認した変更を `main` へ出すときは、`AGENTS.md` の「Git（stagingで確認した変更をmainへ出す）」の手順に従う。**確認モード**では branch 作成/切替は行わない。確認モードからの移行時も最新ベースを確認し、未コミット変更があれば勝手に切り替えず移行方法を提案して指示を待つ。
3. 計画に沿って小さく実装する。責務分離・命名・依存方向は `AGENTS.md` に従う。
4. 個別承認が必要な操作は、対象と影響について承認が得られていることを確認する。未承認なら停止して承認を得る。
5. 承認された変更範囲で正常系、境界値、異常系、回帰リスクをテストする。既存コードへの範囲外のテスト追加は行わない。

## 検証と自己レビュー

PRモードで PR 作成・更新前には文書/Skillのみの変更でもCI相当の確認を実行する。変更範囲に応じて追加検証を行う。

- 必須（文書/Skillのみの変更も含む）: `npm run format:check && npm run check && npm run test:run && npm run build`
- UI/Story 変更: 上記に加え `npm run test:storybook`、必要なら `npm run build-storybook`
- DB: schemaと生成migrationを確認する。`db:generate` は対象と影響の個別承認を得た場合だけ実行する。`db:migrate` / `db:push` / `db:seed` の Preview・本番向け実行は `AGENTS.md` の承認ゲートに従う
- 文書/Skillのみ: 上記の必須コマンドに加え、`git diff --check` と対象固有の検証を行う

失敗を成功扱いにしない。実行できない場合は原因、試した内容、未確認項目を記録する。

`git status --short`、`git diff --check`、`git diff` を確認し、`references/self-review-checklist.md` の該当項目を確認する。今回の変更に問題があれば承認範囲内で修正・再検証・再レビューする。範囲外の問題は「気づいた点」に記載し、修正が必要なら提案して指示を待つ。

## コミット・push・PR

作業前に `git log --oneline --decorate` と差分を確認し、不要なcheckpoint commitを作らない。自分が変更したパスだけを明示してstageし、`git diff --cached` を確認してからcommitする。件名は `AGENTS.md` の commit メッセージ規約に従う。

**確認モード**（`AGENTS.md` の作業モード）のときは、検証と自己レビューまで行い、stage・commit・push・PR は行わない。`references/local-handoff-template.md` の「確認モード」節に沿って、変更ファイル、`git diff` の要点、検証結果、次に PRモードへ進むかを報告して次の指示を待つ。

**PRモード**では、PR 作成・更新前に `git fetch origin` を行い、staging向けではmainの未取り込みと、取り込まず進める判断を得ている場合の前提の変化も再確認する。staging 確認済みを `main` 向けに出す場合も、上記 `AGENTS.md` の同節に従う。`git rev-list --count HEAD..origin/<ベース>` が `0` であることと、`git diff origin/<ベース>...HEAD` に依頼範囲外の変更がないことを確認する。遅れていれば merge または rebase を提案して指示を待ち、rebase などの履歴書き換えは個別承認を得る。検証後に作業branchを push し、指定されたベース向け PR を作成する。既存PRがある場合は同じbranchへのpushで更新し、重複作成しない（`main` / `staging` への直接 push・merge・force push はしない）。PR 作成後やベース変更後はGitHub上の向き先・コミット・変更ファイルを確認し、意図した差分だけであることを確かめてから報告する。PR 本文は日本語で、変更内容、設計判断、実行した検証、未確認事項を書く。引き渡し項目は `references/local-handoff-template.md` の「PRモード（引き渡し）」節を参照する。

commitの削除、squash、rebaseは、対象と影響を示した明示的承認なしに行わない。

## 最終報告

実装内容、設計判断、主要ファイル、検証結果、自己レビューで修正した事項、未実施項目と制約を簡潔に報告する。**PRモード**のときは branch、commit、PR URL も含める。**確認モード**のときは差分の要点と次に PRモードへ進めるかを示す。
