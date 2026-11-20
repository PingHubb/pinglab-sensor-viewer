// English source messages are the keys. Templates only match complete messages;
// numeric values, device IDs and downloaded data are never rewritten.
export const chinese = {
  'PingLab · Sensor Viewer': 'PingLab · 传感器查看器',
  'TACTILE SENSING': '触觉传感',
  'Sensor Viewer': '传感器查看器',
  'Connect. Explore. Record.': '连接 · 探索 · 记录',
  'OFFLINE': '未连接',
  'CHECKING': '正在检查',
  'CONNECTED': '已连接',
  'DEMO': '演示',
  'Quick guide': '使用指南',
  'Connection': '连接',
  'Sensor port': '传感器端口',
  'Choose a USB serial port…': '选择 USB 串口…',
  'Refresh previously permitted ports': '刷新已授权的端口',
  'Refresh ports': '刷新端口',
  'The browser asks you to choose a device when you connect.': '连接时，浏览器会提示您选择设备。',
  'Baud rate': '波特率',
  'Auto': '自动',
  'Grid': '阵列',
  'Auto · firmware': '自动 · 固件',
  'Custom': '自定义',
  'Rows': '行数',
  'Columns': '列数',
  'Exclude last column (reference)': '排除最后一列（参考列）',
  'Leave off for ACM5: use all 20 × 20 channels.': 'ACM5 请勿勾选：使用全部 20 × 20 通道。',
  'Channels checked automatically before acquisition.': '开始采集前自动检查通道。',
  'Connect sensor': '连接传感器',
  'Disconnect': '断开连接',
  'Try demo · no hardware': '体验演示 · 无需硬件',
  'Baseline & display': '基线与显示',
  'Update Calibration': '更新校准',
  'Keep the sensor untouched while re-zeroing.': '重新归零时，请勿触碰传感器。',
  'Signal': '信号',
  'Signed difference': '带符号差值',
  'Raw signal': '原始信号',
  'Baseline': '基线',
  'Signed difference (%)': '带符号差值（%）',
  'Colour range ±': '颜色范围 ±',
  'Show taxel IDs / cell values': '显示触觉单元编号 / 数值',
  'Recording': '数据记录',
  'Record CSV': '开始记录 CSV',
  'All taxels. Every acquired frame.': '记录所有触觉单元及每一帧采集数据。',
  'Download CSV ↓': '下载 CSV ↓',
  'Download metadata JSON ↓': '下载元数据 JSON ↓',
  'Save both files before starting another recording.': '开始下一次记录前，请保存这两个文件。',
  'Data stays on this computer. Keep this tab open while collecting. Recordings stop at 32 MB; download before closing.': '数据仅保存在本机。采集时请保持此标签页开启。记录达到 32 MB 时自动停止；关闭前请下载文件。',
  'Connection log': '连接日志',
  'LIVE SENSOR FIELD': '实时传感阵列',
  'Your sensor, at a glance': '一览传感器数据',
  'Open 3D Plotter ↗': '打开 3D 绘图窗口 ↗',
  'View': '视图',
  'Smooth Map': '平滑二维图',
  'Smooth 3D': '平滑三维图',
  '3D Point Grid': '三维点阵',
  '3D Surface': '三维曲面',
  '3D Heatmap': '三维热力图',
  '2D Heatmap': '二维热力图',
  'Colour': '配色',
  'Jet': '彩虹色',
  'Jet ±': '彩虹色 ±',
  'Blue / orange': '蓝 / 橙',
  'Height': '高度',
  'Top': '俯视',
  'Reset view': '重置视图',
  'Sensor plot: click or use arrow keys to select a taxel. Drag 3D views to rotate, shift-drag to pan, scroll to zoom.': '传感器图：单击或使用方向键选择触觉单元。拖动三维视图旋转，按住 Shift 拖动平移，滚轮缩放。',
  'Make touch visible.': '让触觉可视化。',
  'Connect your sensor to see its live response,': '连接传感器查看实时响应，',
  'or explore the viewer with synthetic demo data.': '或使用模拟数据体验查看器。',
  'Explore demo →': '体验演示 →',
  'NO SENSOR CONNECTED': '尚未连接传感器',
  'Click to select · Drag to rotate · Scroll to zoom': '单击选择 · 拖动旋转 · 滚轮缩放',
  'Colour scale': '颜色标尺',
  'Jet · colour shows the size of the change': '彩虹色 · 颜色表示变化幅度',
  'Selected taxel': '选中的触觉单元',
  'signed sensor units': '带符号传感器单位',
  'signed difference (%)': '带符号差值（%）',
  'raw sensor units': '原始传感器单位',
  'baseline sensor units': '基线传感器单位',
  'Raw': '原始值',
  'SIGNAL HISTORY': '信号历史',
  'Freeze graph': '冻结曲线',
  'Open Signal Viewer ↗': '打开信号查看窗口 ↗',
  'Selected taxel signal history. Hover for values and scroll to change the time window.': '所选触觉单元的信号历史。悬停查看数值，滚轮调整时间窗口。',
  'Hover for timestamp and value': '悬停查看时间戳和数值',
  'Window': '时间窗口',
  's': '秒',
  '.': '。',
  'Index = column × rows + row. Height represents signal, not physical deformation or force. Interpolation affects display only.': '编号 = 列索引 × 行数 + 行索引。高度表示信号，并非实际形变或力。插值仅影响显示。',
  'Ready. Connect a sensor, or try the demo.': '已就绪。请连接传感器，或体验演示。',
  'Close guide': '关闭指南',
  'PINGLAB / QUICK START': 'PINGLAB / 快速入门',
  'A sensor workspace. In your browser.': '浏览器中的传感器工作台。',
  'Open this website in desktop Chrome or Edge over HTTPS.': '请在电脑上的 Chrome 或 Edge 浏览器中，通过 HTTPS 打开本网站。',
  'Connect your USB serial sensor. Close the desktop viewer and Arduino Serial Monitor so the port is free.': '连接 USB 串口传感器。请关闭桌面查看器和 Arduino 串口监视器，释放串口。',
  'Choose the baud rate and grid, then click': '选择波特率和阵列，然后点击',
  'and select your device.': '并选择您的设备。',
  'Leave the sensor untouched and press': '保持传感器未受触碰，然后点击',
  'Pick a taxel, explore the six views, or record all taxels to CSV. Stop recording and download both CSV and JSON.': '选择触觉单元、探索六种视图，或将所有单元记录为 CSV。停止记录后，请下载 CSV 和 JSON 两个文件。',
  'Auto grid uses all reported drive and sense channels. Enable ‘Exclude last column’ only if your sensor has a reference column. Verify orientation with a known corner. Custom grids support up to 1,600 taxels.': '自动阵列使用传感器报告的全部驱动和感应通道。只有传感器确有参考列时才启用“排除最后一列”。请触碰已知角落确认方向。自定义阵列最多支持 1,600 个触觉单元。',
  'Live USB access requires Web Serial.': '实时 USB 连接需要 Web Serial 支持。',
  'Firefox, Safari and most mobile browsers cannot connect here. Demo and plots do not require hardware. A USB adapter driver may still be needed.': 'Firefox、Safari 和大多数手机浏览器无法在此连接设备。演示和绘图无需硬件。部分 USB 适配器可能仍需安装驱动。',
  'This viewer supports the same serial/Arduino/ESP32 firmware as the Windows v0.2.2 app. Direct Goodix USB/HID, robots and firmware flashing are outside its scope.': '本查看器支持与 Windows v0.2.2 应用相同的串口 / Arduino / ESP32 固件。不支持直接连接 Goodix USB/HID、机器人或烧录固件。',
  'Negative signals stay negative. Percent values are undefined when baseline is zero. Graph history holds 3,000 frames and clears after calibration. Freeze pauses only the graph. Downloads stay local; no sensor data is sent to GitHub.': '负信号保留负值。基线为零时，百分比值无定义。曲线历史保存 3,000 帧，校准后清空。“冻结”仅暂停曲线显示。文件保存在本机，传感器数据不会发送到 GitHub。',
  'Browser port permission, file downloads and tab lifetime differ from the desktop app. Real sensor behavior needs verification on your hardware. Keep this tab visible and the computer awake during acquisition.': '浏览器的串口授权、文件下载和标签页运行方式与桌面应用不同。实际传感器行为需在您的硬件上验证。采集时请保持此标签页可见，并防止电脑休眠。',
  '3D Plotter': '3D 绘图窗口',
  'Close': '关闭',
  'Shared signal, colour, height and selection. Drag to rotate · Shift-drag to pan · Scroll to zoom · R to reset': '与主窗口共用信号、配色、高度和选择。拖动旋转 · Shift + 拖动平移 · 滚轮缩放 · R 重置',
  'Expanded 3D sensor plot': '放大的三维传感器图',
  'Signal Viewer': '信号查看窗口',
  'Shared selected taxel and graph freeze. Scroll to adjust the time window.': '与主窗口共用所选触觉单元和曲线冻结状态。滚轮调整时间窗口。',
  'Expanded signal history': '放大的信号历史',
  'This sensor viewer needs JavaScript enabled to draw plots and connect to USB devices.': '本查看器需要启用 JavaScript 才能绘图和连接 USB 设备。',
  'undefined': '无定义',
  'units': '单位',
  'COLUMN →': '列 →',
  'ROW ↓': '行 ↓',
  'row 0 · col 0': '第 0 行 · 第 0 列',
  'Signal history appears after connection': '连接后显示信号历史',
  'Use desktop Chrome or Edge for USB access.': '请使用电脑版 Chrome 或 Edge 连接 USB 设备。',
  'Refresh ports and select the sensor.': '请刷新端口并选择传感器。',
  'No port selected. Ready when you are.': '尚未选择端口，可随时重新连接。',
  'Demo · no hardware channel check': '演示 · 不检查硬件通道',
  'Checking channels and frame size…': '正在检查通道和帧大小…',
  'reference excluded': '已排除参考列',
  'all channels': '全部通道',
  'DEMO · SYNTHETIC DATA': '演示 · 模拟数据',
  'LIVE · USB SERIAL': '实时 · USB 串口',
  'OFFLINE · LAST FRAME': '已断开 · 最后一帧',
  'WAITING · LAST FRAME': '等待数据 · 最后一帧',
  'Connection failed · see the message below or connection log.': '连接失败 · 请查看下方提示或连接日志。',
  'Disconnected. Last readings retained.': '已断开连接，保留最后读数。',
  'Disconnecting…': '正在断开连接…',
  'Stop recording': '停止记录',
  'Recording · waiting for next frame': '记录中 · 等待下一帧',
  'Recording all taxels. Keep this tab open and active.': '正在记录所有触觉单元。请保持此标签页开启并处于前台。',
  'Calibration queued — keep the sensor untouched.': '已安排校准，请勿触碰传感器。',
  'Tab is in the background. Browser throttling may reduce acquisition rate; return to this tab for reliable capture.': '此标签页位于后台，浏览器限速可能降低采集速率。请切回此标签页以确保可靠采集。',
  'Live sensor connection needs desktop Chrome or Edge over HTTPS (or localhost). You can still explore Demo mode here.': '实时连接传感器需要电脑版 Chrome 或 Edge，以及 HTTPS（或 localhost）。您仍可在此体验演示模式。',
  'user stopped': '用户停止',
  'connection error': '连接错误',
  'disconnected': '连接断开',
  '32 MB memory limit reached': '已达到 32 MB 内存上限',
  'Connection cancelled.': '已取消连接。',
  'Checking sensor channels before acquisition…': '正在检查传感器通道，确认后才开始采集…',
  ' (last reference column excluded)': '（已排除最后的参考列）',
  ' (all channels)': '（全部通道）',
  'Channel check failed: no two consecutive matching valid replies. Acquisition has not started. Check the sensor, cable and baud rate, then reconnect.': '通道检查失败：未收到连续两次一致的有效回复。尚未开始采集。请检查传感器、线缆和波特率，然后重新连接。',
  'No complete frames. Check firmware, baud rate and cable.': '未收到完整数据帧，请检查固件、波特率和线缆。',
  'No stored baseline. Keep sensor untouched; collecting 20 baseline frames…': '未找到已存储的基线。正在采集 20 帧基线，请勿触碰传感器…',
  'Baseline acquisition failed. Reconnect the sensor.': '基线采集失败，请重新连接传感器。',
  'synthetic baseline': '模拟基线',
  'stored sensor baseline': '传感器已存储的基线',
  '20-frame software baseline': '20 帧软件基线',
  'Updating baseline — keep the sensor untouched…': '正在更新基线，请勿触碰传感器…',
  'No calibration response. Previous baseline retained.': '未收到校准回复，已保留原有基线。',
  'Baseline updated. Signed difference = raw − baseline.': '基线已更新。带符号差值 = 原始值 − 基线。',
  'Sensor stopped replying. Check the cable and reconnect.': '传感器停止回复，请检查线缆并重新连接。',
  'Sensor stream recovered.': '传感器数据流已恢复。',
  'Choose 1–64 rows and columns, with at most 1,600 taxels.': '行数和列数须为 1–64，总数不超过 1,600 个触觉单元。',
  'Invalid channelCheck response. Expected drive and sense counts.': 'channelCheck 回复无效，需要驱动和感应通道数量。',
  'Recording is closed.': '记录已结束。',
  'Sensor disconnected.': '传感器已断开。',
  'Serial response exceeded buffer limit.': '串口回复超出缓冲区上限。',
  'Serial input overflow; reconnect the sensor.': '串口输入溢出，请重新连接传感器。',
  'Concurrent serial commands are not allowed.': '不能同时发送多个串口命令。',
  'Serial connection is closed.': '串口连接已关闭。',
  'Taxel {id}': '触觉单元 {id}',
  'Row {row} · column {column}': '第 {row} 行 · 第 {column} 列',
  'Permitted port {id}': '已授权端口 {id}',
  'Port list unavailable: {error}': '无法获取端口列表：{error}',
  'Demo grid: {rows} rows × {columns} columns': '演示阵列：{rows} 行 × {columns} 列',
  'Verified: {rows} rows × {columns} columns · {mode}': '已验证：{rows} 行 × {columns} 列 · {mode}',
  '{rows} × {columns} · {count} taxels': '{rows} × {columns} · {count} 个触觉单元',
  'Recording · {count} frames · {size} MB': '记录中 · {count} 帧 · {size} MB',
  '{count} frames · {rate} Hz · baseline v{version}': '{count} 帧 · {rate} Hz · 基线 v{version}',
  '{count} frames': '{count} 帧',
  'Disconnected: {error}': '已断开：{error}',
  'Ready to save · {count} frames · {size} MB': '可以保存 · {count} 帧 · {size} MB',
  'Recording stopped ({reason}). Download the CSV and metadata JSON before closing this tab.': '记录已停止（{reason}）。关闭此标签页前，请下载 CSV 和元数据 JSON。',
  '{low} → {high} · frame auto range': '{low} → {high} · 当前帧自动范围',
  '0 → ±{range} {unit} · size of change': '0 → ±{range} {unit} · 变化幅度',
  '−{range} → 0 → +{maximum} {unit} · signed colour': '−{range} → 0 → +{maximum} {unit} · 带符号配色',
  'Selected grid {rows} × {columns} disagrees with verified sensor grid {actualRows} × {actualColumns}. Choose Auto or the matching grid. Only exclude a reference column if your sensor has one.': '所选阵列 {rows} × {columns} 与已验证的传感器阵列 {actualRows} × {actualColumns} 不一致。请选择“自动”或匹配的阵列。只有传感器确有参考列时才可排除参考列。',
  'Channels verified twice: drive {drive}, sense {sense} → {rows} rows × {columns} columns{mode}. Checking first frame…': '已连续两次验证通道：驱动 {drive}、感应 {sense} → {rows} 行 × {columns} 列{mode}。正在检查第一帧…',
  'Opening sensor at {baud} baud…': '正在以 {baud} 波特率打开传感器…',
  'Channel/frame mismatch: channelCheck reports drive {drive} × sense {sense} ({expected} values), but the frame contains {actual}. Acquisition has not started.': '通道与帧不匹配：channelCheck 报告驱动 {drive} × 感应 {sense}（{expected} 个值），但数据帧包含 {actual} 个值。尚未开始采集。',
  'DEMO · synthetic data · {baseline}': '演示 · 模拟数据 · {baseline}',
  'Sensor connected · {baseline}': '传感器已连接 · {baseline}',
  'Calibration failed: {error}': '校准失败：{error}',
  'Waiting for a complete frame ({misses}/5)…': '正在等待完整数据帧（{misses}/5）…',
  'Frame does not match {rows} × {columns}. Choose the correct grid and reconnect.': '数据帧与 {rows} × {columns} 不匹配。请选择正确阵列并重新连接。',
  'Taxel {id} · row {row}, column {column} · {value}': '触觉单元 {id} · 第 {row} 行、第 {column} 列 · {value}',
};

export const LANGUAGE_KEY = 'pinglab-viewer-language';
let language = 'en';
export const getLanguage = () => language;
export function setLanguage(value, storage) {
  language = value === 'zh-CN' ? 'zh-CN' : 'en';
  try { storage?.setItem(LANGUAGE_KEY, language); } catch { /* Private browsing may block storage. */ }
  return language;
}
export function restoreLanguage(storage) {
  try { return setLanguage(storage?.getItem(LANGUAGE_KEY)); } catch { return setLanguage('en'); }
}
const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const templates = Object.entries(chinese).filter(([key]) => /\{\w+\}/.test(key)).map(([key, value]) => {
  const names = [...key.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
  const pattern = key.split(/\{\w+\}/).map(escape).join('([\\s\\S]+?)');
  return {pattern:new RegExp(`^${pattern}$`), names, value};
}).sort((a,b) => b.pattern.source.length - a.pattern.source.length);
export function translate(source, depth = 0) {
  if (language === 'en' || depth > 8) return source;
  if (Object.hasOwn(chinese, source)) return chinese[source];
  if (!/[a-z]/i.test(source)) return source;
  // Preserve spacing around inline labels, inputs and strong elements.
  const trimmed = source.trim();
  if (trimmed !== source) return source.slice(0, source.indexOf(trimmed)) + translate(trimmed, depth+1) + source.slice(source.indexOf(trimmed)+trimmed.length);
  for (const {pattern, names, value} of templates) {
    const match = source.match(pattern);
    if (match) {
      const args = Object.fromEntries(names.map((name,i) => [name, translate(match[i+1],depth+1)]));
      return value.replace(/\{(\w+)\}/g, (_,name) => args[name]);
    }
  }
  // Auto-baud failures contain one complete error per attempted baud rate.
  if (source.includes(' / ')) return source.split(' / ').map(part => translate(part,depth+1)).join(' / ');
  return source;
}

export function bindStaticText(root) {
  const bindings = [];
  const walker = root.ownerDocument.createTreeWalker(root, 4);
  while (walker.nextNode()) {
    const node = walker.currentNode, source = node.textContent;
    if (source.trim() && !node.parentElement.closest('script,style,#language-switch'))
      bindings.push(() => { node.textContent = translate(source); });
  }
  for (const element of root.querySelectorAll('[aria-label],[title]')) {
    if (element.id === 'language-switch') continue;
    for (const attr of ['aria-label','title']) if (element.hasAttribute(attr)) {
      const source = element.getAttribute(attr);
      bindings.push(() => element.setAttribute(attr,translate(source)));
    }
  }
  return () => bindings.forEach(update => update());
}
