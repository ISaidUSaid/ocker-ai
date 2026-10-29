// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
const themes=['glass','none','chambers','caseboard','blueprint','after-hours','paper'];
test('all themes style cards and dialogs, retain records and appear in integration code',async({page},testInfo)=>{
 await page.goto('/');await expect(page.locator('.ocker-card')).toHaveCount(46);
 const select=page.getByRole('combobox',{name:'Appearance'});
 await expect(select.locator('option')).toHaveCount(7);
 const originalTitle=await page.locator('.ocker-card h3').first().textContent();
 const surfaces=new Map();
 for(const theme of themes){
  await select.selectOption(theme);
  await expect(page.locator('.ocker-root').first()).toHaveAttribute('data-ocker-theme',theme);
  await expect(page.locator('.ocker-card')).toHaveCount(46);
  await expect(page.locator('.ocker-card h3').first()).toHaveText(originalTitle);
  surfaces.set(theme,await page.locator('.ocker-card').first().evaluate(el=>getComputedStyle(el).backgroundColor));
  await page.locator('.ocker-card').first().getByRole('button',{name:'Source evidence',exact:true}).click();
  const dialog=page.getByRole('dialog');await expect(dialog).toBeVisible();
  const blur=await dialog.evaluate(el=>getComputedStyle(el,'::backdrop').backdropFilter);
  expect(blur.includes('blur')).toBe(theme==='glass');
  if(theme==='after-hours'){await expect(dialog).toHaveCSS('background-color','rgb(37, 51, 63)');await expect(dialog).toHaveCSS('color','rgb(237, 241, 242)');}
  await dialog.getByRole('button',{name:'Close',exact:true}).click();
 }
 expect(new Set(surfaces.values()).size).toBeGreaterThanOrEqual(6);
 const card=page.locator('.ocker-card').first();
 await expect(card.locator('.ocker-card-header')).toHaveCSS('border-bottom-color','rgb(188, 96, 101)');
 expect(await card.locator('.ocker-summary').evaluate(el=>getComputedStyle(el).backgroundImage)).toContain('repeating-linear-gradient');
 await card.scrollIntoViewIfNeeded();await page.screenshot({path:testInfo.outputPath('paper.png')});
 await select.selectOption('after-hours');await page.locator('.ocker-code-disclosure summary').click();
 await expect(page.locator('.ocker-code-disclosure pre')).toContainText("theme: 'after-hours'");
 await page.locator('[data-option="locale"]').selectOption('pt');
 await expect(page.locator('[data-option="theme"]')).toHaveValue('after-hours');
 await expect(page.locator('[data-option="theme"] option[value="paper"]')).toHaveText('Ficha pautada');
 await expect(page.locator('.ocker-card')).toHaveCount(46);
});
test('mobile notes, import dialogs and editor use the selected theme',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('.ocker-card')).toHaveCount(46);
 for(const theme of themes){
  await page.locator('[data-option="theme"]').selectOption(theme);
  await page.locator('.ocker-card').first().getByRole('button',{name:'Add note',exact:true}).click();
  await expect(page.getByRole('dialog')).toBeVisible();await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();
  await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
 await page.locator('[data-option="theme"]').selectOption('after-hours');
 await page.getByRole('button',{name:'Paste',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCSS('background-color','rgb(37, 51, 63)');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Edit OCKER file',exact:true}).click();await expect(page.getByRole('dialog')).toHaveCSS('background-color','rgb(37, 51, 63)');await expect(page.locator('.cm-editor')).toHaveCSS('color','rgb(237, 241, 242)');await page.getByRole('dialog').getByRole('button',{name:'Cancel',exact:true}).click();
});
test('themed PNG and PDF exports still capture the filtered chronology',async({page})=>{
 await page.goto('/');await expect(page.locator('.ocker-card')).toHaveCount(46);
 await page.locator('[data-option="theme"]').selectOption('paper');await page.getByRole('combobox',{name:'Filter status'}).selectOption('disputed');
 for(const [label,magic] of [['Export PNG','PNG'],['Export PDF','%PDF']]){
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:label,exact:true}).click();
  const bytes=await readFile(await(await pending).path());expect(bytes.subarray(magic==='PNG'?1:0,4).toString()).toBe(magic);
 }
});
