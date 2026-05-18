const fs = require('fs');
const path = require('path');

let puppeteer;
try{
  puppeteer = require('puppeteer');
}catch(e){
  console.error('\nError: Puppeteer is not installed or could not be required.');
  console.error('Install it with: npm install puppeteer --save-dev');
  process.exit(3);
}

(async function(){
  try{
    const outDir = path.resolve(__dirname, '..', 'screenshots');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const url = process.argv[2] || 'http://127.0.0.1:8080/#/';

    // Basic reachability check (optional): try to fetch the URL via node http(s) before launching browser
    const isHttp = url.startsWith('http://') || url.startsWith('https://');
    if (!isHttp){
      console.error('Provided URL must start with http:// or https://');
      process.exit(4);
    }

    const browser = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
    const page = await browser.newPage();
    await page.setViewport({width:1280, height:900});
    console.log('Opening', url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    // give any animations one extra second to run
    await new Promise(res => setTimeout(res, 1000));
    const out = path.join(outDir, 'home.png');
    await page.screenshot({ path: out, fullPage: true });
    console.log('Saved', out);
    await browser.close();
    process.exit(0);
  }catch(err){
    console.error('\nCapture failed:');
    console.error(err && err.message ? err.message : err);
    if (err && /PUPPETEER|Chromium|executable/i.test(String(err))){
      console.error('\nHint: Puppeteer may require additional dependencies or a bundled Chromium.');
      console.error('Try reinstalling puppeteer or set the environment variable CHROME_PATH to a Chrome/Chromium executable.');
    }
    process.exit(2);
  }
})();
