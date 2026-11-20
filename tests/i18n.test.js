import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chinese,translate,setLanguage,getLanguage,restoreLanguage,LANGUAGE_KEY} from '../src/i18n.js';
import {Grid,Recording} from '../src/core.js';

test('Chinese covers page labels and accessibility text without missing template values', () => {
  setLanguage('zh-CN');
  const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const sources=[...html.matchAll(/>([^<>]+)</g)].map(match=>match[1].trim());
  sources.push(...[...html.matchAll(/(?:aria-label|title)="([^"]+)"/g)].map(match=>match[1]));
  for(const source of sources.filter(text=>/[a-z]/i.test(text)&&!['P','PingLab','中文'].includes(text)&&!text.startsWith('WEB ·')))
    assert.notEqual(translate(source),source,`Missing Chinese: ${source}`);
  for(const [source,target] of Object.entries(chinese))
    assert.deepEqual([...source.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),[...target.matchAll(/\{\w+\}/g)].map(m=>m[0]).sort(),source);
  setLanguage('en');
});

test('live channel, failure and recording messages retain counts in Chinese and switch back', () => {
  setLanguage('zh-CN');
  assert.equal(translate('Verified: 20 rows × 20 columns · all channels'),'已验证：20 行 × 20 列 · 全部通道');
  assert.equal(translate('20 × 20 · 400 taxels'),'20 × 20 · 400 个触觉单元');
  assert.equal(translate('Taxel 399 · row 19, column 19 · undefined'),'触觉单元 399 · 第 19 行、第 19 列 · 无定义');
  assert.equal(translate('Recording · 1,250 frames · 4.2 MB'),'记录中 · 1,250 帧 · 4.2 MB');
  assert.equal(translate('Disconnected: No complete frames. Check firmware, baud rate and cable. / Sensor disconnected.'),'已断开：未收到完整数据帧，请检查固件、波特率和线缆。 / 传感器已断开。');
  assert.equal(translate('Channels verified twice: drive 20, sense 20 → 20 rows × 20 columns (all channels). Checking first frame…'),'已连续两次验证通道：驱动 20、感应 20 → 20 行 × 20 列（全部通道）。正在检查第一帧…');
  assert.equal(translate('   Raw '),'   原始值 ');
  assert.equal(translate('<unknown device error>'),'<unknown device error>');
  setLanguage('en');
  assert.equal(translate('Verified: 20 rows × 20 columns · all channels'),'Verified: 20 rows × 20 columns · all channels');
});

test('language is remembered with safe fallback when storage is unavailable', () => {
  const values=new Map(),storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  setLanguage('zh-CN',storage);assert.equal(values.get(LANGUAGE_KEY),'zh-CN');
  setLanguage('en');restoreLanguage(storage);assert.equal(getLanguage(),'zh-CN');
  restoreLanguage({getItem(){throw new Error('Blocked');}});assert.equal(getLanguage(),'en');
  setLanguage('zh-CN',{setItem(){throw new Error('Blocked');}});assert.equal(getLanguage(),'zh-CN');
  restoreLanguage({getItem:()=>'<invalid locale>'});assert.equal(getLanguage(),'en');
});

test('switching language preserves all 400 channels and the CSV/metadata format', () => {
  const grid=Grid.fromChannels([20,20]),recording=new Recording(grid,{demo:true});
  const packet={raw:Array.from({length:400},(_,i)=>i),baseline:Array(400).fill(0),sequence:1,version:1,time:0,utc:'2026-11-20T00:00:00.000Z'};
  recording.append(packet);setLanguage('zh-CN');recording.append({...packet,sequence:2,time:20});setLanguage('en');
  const result=recording.close();assert.equal(result.count,2);assert.equal(result.metadata.columns,20);
  assert.equal(result.lines[0].split(',').length,804);assert.match(result.lines[0],/taxel_399_raw/);
  assert.equal(result.lines[1].split(',').length,804);assert.equal(result.metadata.stop_reason,'user stopped');
});
