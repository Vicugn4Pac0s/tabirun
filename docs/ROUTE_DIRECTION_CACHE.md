# 経路計算結果の定期削除

Issue #32 の経路計算結果は、取得から29日（696時間）経過した時点で削除対象にする。Supabase Cron（`pg_cron`）で毎時0分に削除する。Google Routes APIの緯度経度の保持上限30日に対し、通常は約23時間以上の余裕を持って消す設計。

アクセス時の再取得と定期削除は別の役割を持つ。Cronは未閲覧のルートも含めて古い計算結果だけを消し、Google APIへの再問い合わせやクォータ消費は行わない。経路の保存・再利用は取得・作成・更新APIに組み込んでいる。詳細画面と編集画面の初期表示には取得済みの経路を使い、編集画面で地点を変更した場合だけプレビューを再計算する。作成・地点変更の保存時にはサーバー側で経路を計算して保存する。

## 削除対象

`direction_calculated_at <= CURRENT_TIMESTAMP - INTERVAL '696 hours'` の行で、次の6列をすべて `NULL` に戻す。`routes_api`・`straight_line` の両方を対象にする。

- `encoded_polyline`
- `distance_meters`
- `duration`
- `direction_source`
- `direction_calculated_at`
- `direction_points_hash`

ルート自体、タイトル、利用者が登録した `points`、所有者、作成日・更新日は変更しない。SQLによる更新なので、Drizzleのアプリ側の `$onUpdate` も実行されない。計算日時がNULLの既存ルートは対象外。APIの保存処理では、計算日時を含めた結果を同時に保存する。

## 導入

本番・Preview用DB（`tabirun-preview`）にそれぞれ1ジョブずつ登録する。stagingとPRプレビューは同じPreview用DBを共有するため、デプロイごとには登録しない。

1. 対象プロジェクト・DBと承認範囲を確認する。各DBへのmigration適用、`pg_cron`有効化、ジョブ登録は、対象・影響を示してそれぞれ明示承認を得る。
2. #30の `0002` に続き、経路保存列を追加する `0003_sturdy_reavers.sql` を適用済みであることを確認する。適用方法は [ENVIRONMENTS.md](./ENVIRONMENTS.md) を参照する。
3. Supabase DashboardのIntegrations → Cronで `pg_cron` を有効にする。すでに有効ならそのまま使う。他のジョブを消す可能性があるため、拡張の無効化・再インストールはしない。
4. DashboardのSQL Editorで登録先のDBを再確認し、[設定SQL](../scripts/sql/schedule-route-direction-cleanup.sql) を管理者として実行する。アプリのData APIやsupabase-jsは使わない。これはDB管理用の設定SQLであり、アプリからのDBアクセスは既存のDrizzle経由を維持する。
5. 下記SQLでジョブ名・頻度・実行者・DB・更新SQL・有効状態を確認し、次の毎時実行後に成功履歴を確認する。同じジョブ登録者から同名で再実行すると既存ジョブの設定が更新される。別の登録者で重複登録しない。

```sql
SELECT jobid, jobname, schedule, database, username, active, command
FROM cron.job
WHERE jobname = 'tabirun-route-direction-cleanup';
```

期待値はジョブ1件、scheduleが `0 * * * *`、activeがtrue。登録直後の手動削除は不要。次の毎時実行から、全所有者の期限対象データが削除されるため、登録承認にはこの影響も含める。

設定SQLは拡張のインストールやテーブル作成を行わない。先に列の存在を確認し、登録をトランザクション内で行う。失敗した場合はROLLBACKして原因を確認する。通常の `drizzle/` migrationやアプリ起動処理には含めず、ローカルの通常PostgreSQLで `pg_cron` を必須にしない。

対象環境の登録と成功履歴を確認してから、その環境へ保存機能を含むコードを反映する。Previewでの確認を本番の設定済み確認として扱わない。確認日・対象環境・ジョブID・実行結果をPRへ記録する。

2026-11-11時点でPreviewは0003適用後の履歴・6列・indexを確認済み。Cronの登録・実行成功はYOSHIKIの確認による。本番へのmigration適用とCron設定は未実施で、本番反映前に別途必要。

## 実行確認と障害対応

本番・Previewそれぞれで、DashboardのCron → History、または次のSQLで履歴を確認する。履歴の詳細や登録済みSQLに位置座標を追加して記録しない。

```sql
SELECT runs.jobid, runs.status, runs.start_time, runs.end_time, runs.return_message
FROM cron.job_run_details AS runs
JOIN cron.job AS jobs ON jobs.jobid = runs.jobid
WHERE jobs.jobname = 'tabirun-route-direction-cleanup'
ORDER BY runs.start_time DESC
LIMIT 24;
```

直近の完了実行が成功し、直近の成功が2時間以内であることを確認する。2時間を超えて成功がない、または失敗している場合は、30日の上限を待たずにDB稼働状態・ジョブの有効状態・権限・ロックを調べて復旧する。これは運用時の確認基準であり、自動通知はまだ導入していない。初回導入時に確認担当と頻度を決め、余裕のある時間内に検知・対応できる運用を整える。

長時間のDB停止やジョブ停止があれば、Cronを設定しただけでは30日以内の削除を保証できない。再開時は成功履歴と期限超過件数を確認する。バックアップ復元時も、ジョブの復元・有効状態と古い計算結果の残存を確認する。手動のデータ削除や設定修正は対象DBごとに別途承認を得る。

```sql
SELECT count(*) AS overdue_directions
FROM public.tabirun_route
WHERE direction_calculated_at <= CURRENT_TIMESTAMP - INTERVAL '720 hours';
```

0件が正常。件数だけを確認し、polylineや登録地点はログへ出さない。対象が多く実行に時間がかかる場合は、履歴から所要時間・ロック状況を確認してから対策を検討する。

## 停止

停止は計算結果が消えなくなる操作なので、対象DBと影響を示して承認を得る。DashboardでこのジョブだけをInactiveにする。`pg_cron`拡張全体や他のジョブは変更しない。停止中に経路の保存機能を運用し続けない。再開後はactiveと成功履歴を再確認する。

## SQLの回帰確認

使い捨ての `pg_cron` 対応DBで0003と設定SQLを適用した後、同じ登録者として [SQLテスト](../scripts/sql/schedule-route-direction-cleanup.test.sql) を実行する。本番・Previewでは実行しない。

登録された更新SQLの対象テーブルを一時テーブルへ差し替え、期限の直前・一致・超過、未計算の既存行、直線結果、別所有者を検証する。6列が消えること、期限前のデータやルート本体・更新日が変わらないことを確認し、最後にROLLBACKする。失敗した場合もROLLBACKして一時テーブルを破棄する。

`npm run test:run` はこのSQLテストやCronの実発火を実行しない。通常のローカルDockerは `pg_cron` 非搭載のため、SQLテストと実発火は別途検証が必要。

## 参考

- [Google Maps Platform Service Specific Terms §19.3](https://cloud.google.com/maps-platform/terms/maps-service-terms)
- [Supabase Cron](https://supabase.com/docs/guides/cron)
- [Cronの有効化](https://supabase.com/docs/guides/cron/install)
- [ジョブ登録・履歴確認](https://supabase.com/docs/guides/cron/quickstart)
