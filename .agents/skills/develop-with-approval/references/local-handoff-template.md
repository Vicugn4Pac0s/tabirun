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

- staging 確認済みを `main` へ出す場合: `AGENTS.md` の「Git（stagingで確認した変更をmainへ出す）」に従ったか
- ベースbranch（main / staging。依頼に合わせ、未指定なら main）:
- staging向けの場合、mainの未取り込みの有無と、未取り込みがあれば継続方針・理由:
- 作業branch:
- commit:
- PR URL:
- 最新ベースの確認: `git fetch origin` 後、`git rev-list --count HEAD..origin/<ベース>` が `0`
- GitHub上のPRの向き先・コミット・変更ファイルの確認結果:
- 差分確認: `git diff origin/<ベース>...HEAD` に依頼範囲外の変更がないこと

merge はユーザーが行う（`main` / `staging` への直接 push・merge はエージェントが行わない）。

### 残っている課題・制約

## 気づいた点（該当時・両モード共通）

- 依頼範囲外の既存コードの規約違反や確認で見つかった不足は、修正せずここに報告する。対応が必要な場合は提案して指示を待つ。
