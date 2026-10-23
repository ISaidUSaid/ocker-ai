// SPDX-License-Identifier: Apache-2.0
// Author: Jenko <adam@isaidusaid.com>
import {test,expect} from '@playwright/test';
for(const [name,url] of [['Angular','http://127.0.0.1:8871'],['React','http://127.0.0.1:8872'],['Node + Angular','http://127.0.0.1:8873']]) {
 test(name+' loads, switches device view and retains a note',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));await page.goto(url);
  await page.getByRole('button',{name:'Load Joe & Jill example',exact:true}).click();await expect(page.getByText('12 of 12 events',{exact:true})).toBeVisible();
  await page.setViewportSize({width:390,height:844});const card=page.locator('.ocker-card').first();await card.getByRole('button',{name:'Add note',exact:true}).click();
  await page.getByLabel('Your note').fill(name+' integration note');await page.getByRole('button',{name:'Save note',exact:true}).click();await expect(card.getByRole('button',{name:'▱ 1',exact:true})).toBeVisible();expect(errors).toEqual([]);
 });
}
