# OFC × MAME KOF97

基于 [lrusso/MAME](https://github.com/lrusso/MAME)（fbalpha2012 JS）。Host 自动加载 `./kof97.zip`（已合并 neogeo BIOS）。

## 角色

| 端 | OFC role | 职责 |
| --- | --- | --- |
| Host | `answer` | 自动跑 KOF97，本机键=**1P**，收 Guest 键注入 **2P**，JPEG 推流 |
| Guest | `offer` | 本机键→OFC→Host 2P；显示 Host 画面 |

## 准备（本地一次）

```bash
pnpm --filter homepage copy:mame
```

从 `NesEmulatorWeb` 拷贝 `MAME.min.js`，并把 `roms/kof97.zip` + `roms/neogeo.zip` 合并为 `public/examples/mame-kof/kof97.zip`。二者均 gitignore，勿提交。

## 协议（OFC Connection JSON）

- Guest→Host: `{ type: 'p2-key', action, down }`
- Host→Guest: `{ type: 'frame', jpeg: '<base64>' }`（原分辨率 JPEG 0.95≈60fps；Guest CSS 像素放大）
- Host 失焦不暂停（否则 2P 输入会“失灵”）
