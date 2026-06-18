# Release & Share Playbook

## 1) 清理本機連結

- README 與 web README 說明公開版為 static BYO 0G，不要求專案維護者提供共享 API。
- 確認不會出現 `.env` 或個人電腦路徑（例如 `/Users/...`、`file://...`）在對外文件與 release note 中。
- 確認不把本地資料庫或本機快取上傳到分享資源中（`*.sqlite`, `data/archive/` 需排除）。

## 2) 發佈到 GitHub

- 建立/更新版本 tag：

```bash
git tag v0.1.0-alpha
git push origin v0.1.0-alpha
```

- 發布 Release Note（可直接貼這份文檔重點）：

  - 主要功能
  - 本地-first 保證
  - 0G-first / user-owned Router 與 growth package 方向
  - 資料治理聲明

- 可選：先生成本地上架套件（不含 `.git`、`data`、`node_modules`）：
- 可選：先生成本地上架套件（不含 `.git`、`.env*`、`data`、`node_modules`、`docs/basar-handoff`）：

```bash
./scripts/release_pack.sh v0.1.0-alpha
```

會輸出 `artifacts/basar-v0.1.0-alpha.tar.gz`，可作為對外分享壓縮檔。

- 若使用 GitHub 發佈 helper，預設是 dry run：

```bash
./scripts/publish_github.sh https://github.com/<owner>/basar.git v0.1.0-alpha
```

通過安全 review 並取得維護者批准後才使用：

```bash
./scripts/publish_github.sh --execute https://github.com/<owner>/basar.git v0.1.0-alpha
```

## 3) 公開展示資源

- 若要掛網站 demo：使用 GitHub Pages 或其他靜態託管，並說明使用者自帶 0G Router、模型、憑證與 storage workflow。
- 發布社群貼文時，附帶：
  - 專案定位（1 行）
  - 本地化與可移植資料治理重點
  - 問題回報方式
  - 安全與授權限制

## 4) 上架後監控

- 驗證：
  - 公開靜態頁可達
  - `license`, `SECURITY.md`, `CODE_OF_CONDUCT.md` 可見
  - `data governance` 規範可見
- 開啟 issue 範本，固定用 `good first issue` 指引新手貢獻者。

## 5) 未來正式上線前置條件

- 補上 0G Storage 官方 browser SDK 或 gateway flow 的 e2e 驗證。
- 檢查使用者憑證只存在使用者控制的位置，不進入維護者後端或前端 bundle。
