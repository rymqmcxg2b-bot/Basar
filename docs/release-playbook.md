# Release & Share Playbook

## 1) 清理本機連結

- README 與 web README 僅保留 `YOUR_API_BASE_URL`、`YOUR_API_ENDPOINT` 佔位符。
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
  - 0G 狀態（dry-run only）
  - 資料治理聲明

- 可選：先生成本地上架套件（不含 `.git`、`data`、`node_modules`）：

```bash
./scripts/release_pack.sh v0.1.0-alpha
```

會輸出 `artifacts/hacker-librarian-v0.1.0-alpha.tar.gz`，可作為對外分享壓縮檔。

## 3) 公開展示資源

- 若要掛網站 demo：提供你自己的 API 與前端網址，並在說明中用 `YOUR_API_BASE_URL` 取代預設示例。
- 發布社群貼文時，附帶：
  - 專案定位（1 行）
  - 本地化與可移植資料治理重點
  - 問題回報方式
  - 安全與授權限制

## 4) 上架後監控

- 驗證：
  - `/health` 可達
  - `license`, `SECURITY.md`, `CODE_OF_CONDUCT.md` 可見
  - `data governance` 規範可見
- 開啟 issue 範本，固定用 `good first issue` 指引新手貢獻者。

## 5) 未來正式上線前置條件

- 替換 0G storage/compute 的 TODO 為正式 SDK 呼叫並補上 e2e 驗證。
- 檢查依賴和憑證載入方式是否只由環境變數提供。
