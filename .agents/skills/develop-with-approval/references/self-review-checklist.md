# 自己レビューチェックリスト

- 要件と完了条件を満たし、承認範囲を逸脱していない
- 既存設計、命名、責務分離、依存方向に沿い、不要な変更がない
- `any`、不要な型アサーション、null/境界値/非同期処理の見落としがない
- 外部入力のvalidation、認証・認可、所有者条件、SQL更新・削除条件が適切である
- 秘密情報、個人情報、debug出力、生成物を残していない
- エラー、loading、empty、disabled状態、性能、a11y、responsiveを確認した
- 正常系、境界値、異常系、回帰リスクをテストし、文書更新要否を確認した
- `git diff --check`、staged/unstaged差分、lockfile、不要ファイル、自分以外の変更混入を確認した
- `git log --oneline --decorate` を確認し、不要なcheckpoint commitやmerge commitを作っていない
- merge後に不要なlocal branch/refを削除し、必要なcommitだけが残っている
- 問題を見つけた場合は修正、再検証、再レビューを実施した
