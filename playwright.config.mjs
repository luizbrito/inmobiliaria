import {defineConfig} from '@playwright/test';
import {browserOptions} from './tests/helpers/fixtures.mjs';
export default defineConfig({
 testDir:'./tests/e2e',fullyParallel:false,workers:1,retries:0,forbidOnly:!!process.env.CI,
 timeout:45000,expect:{timeout:5000,toHaveScreenshot:{maxDiffPixelRatio:0.02}},
 outputDir:'reports/browser-artifacts',snapshotPathTemplate:'{testDir}/baselines/{projectName}/{testFilePath}/{arg}{ext}',
 reporter:[['line'],['junit',{outputFile:'reports/'+(process.env.TEST_LAYER||'playwright')+'.xml'}],['html',{outputFolder:'reports/html',open:'never'}]],
 use:{headless:true,viewport:{width:1440,height:1000},screenshot:'only-on-failure',trace:'retain-on-failure',serviceWorkers:'block'},
 projects:[{name:'chromium',use:{browserName:'chromium',launchOptions:browserOptions()}},...(process.env.TEST_EXTENDED==='true'?[{name:'firefox',use:{browserName:'firefox'}},{name:'webkit',use:{browserName:'webkit'}}]:[])],
});
