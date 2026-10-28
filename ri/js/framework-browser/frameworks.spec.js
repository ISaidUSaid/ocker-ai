// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {test,expect} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import {createRecord} from '../src/model.js';
for(const [name,url] of [['Angular','http://127.0.0.1:8871'],['React','http://127.0.0.1:8872'],['Node + Angular','http://127.0.0.1:8873']]) {
 test(name+' loads, switches device view and retains a note',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(url);
  await expect(page.locator('.demo__wordmark')).toBeVisible();
  expect(await page.locator('.demo__wordmark').evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
  const iconPath=await page.locator('link[rel="icon"]').getAttribute('href');
  const icon=await page.request.get(new URL(iconPath,url).href);expect(icon.ok()).toBe(true);
  expect((await icon.body()).subarray(1,4).toString()).toBe('PNG');
  await expect(page.locator('.demo__status')).toContainText('Next:');
  await page.getByRole('button',{name:'Joe and Jill Blogs Example Chronology',exact:true}).click();await expect(page.getByText('46 of 46 events',{exact:true})).toBeVisible();
  await expect(page.locator('.demo__status')).toContainText('Review your chronology');
  await expect(page.locator('.ocker-card').first()).toHaveCSS('background-color','rgb(255, 255, 255)');expect(await page.locator('.ocker-card').first().evaluate(el=>getComputedStyle(el,'::after').backdropFilter)).toContain('blur');
  await page.setViewportSize({width:390,height:844});const card=page.locator('.ocker-card').first();await card.getByRole('button',{name:'Add note',exact:true}).click();
  await page.getByLabel('Your note').fill(name+' integration note');await page.getByRole('button',{name:'Save note',exact:true}).click();await expect(card.getByRole('button',{name:'▱ 1',exact:true})).toBeVisible();expect(errors).toEqual([]);
  const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save JSON',exact:true}).click();const saved=JSON.parse(await readFile(await(await download).path(),'utf8'));expect(saved.notes.some(note=>note.body===name+' integration note')).toBe(true);
  await expect(page.getByRole('button',{name:'Find relationships',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Edit OCKER file',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Edit OCKER file'});const edited=createRecord(name+' JSON edit');await dialog.locator('.cm-content').fill(JSON.stringify(edited));await dialog.getByRole('button',{name:'Apply changes'}).click();await expect(dialog).not.toBeVisible();await expect(page.getByRole('heading',{name:name+' JSON edit',exact:true})).toBeVisible();
  await expect(page.locator('.ocker-code-disclosure summary')).toHaveCount(1);
 });
}
