// node Hackerrank.js --url="https://www.hackerrank.com" --config=config.json
// npm init -y
// npm install minimist
// npm install puppeteer

let minimist = require("minimist");
let fs = require("fs");
let puppeteer = require("puppeteer");


let args = minimist(process.argv);

let configJSON = fs.readFileSync(args.config,"utf-8");
let configJSO = JSON.parse(configJSON);

async function run(){
    let browser = await puppeteer.launch({
        headless: false,
        args: [
            '--start-maximized'
        ],
        defaultViewport :null
    });
    
    let pages = await browser.pages();
    let page = pages[0];
    await page.goto(args.url);

    //click on login
    await page.waitForSelector("a[data-event-action='Login']");
    await page.click("a[data-event-action='Login']");

    //click on developer login
    await page.waitForSelector("a[href='https://www.hackerrank.com/login']");
    await page.click("a[href='https://www.hackerrank.com/login']");

    //type username
    await page.waitForSelector('input[name="username"]');
    await page.type('input[name="username"]',configJSO.userid,{delay : 30});
    //type password
    await page.waitForSelector('input[name="password"]');
    await page.type('input[name="password"]',configJSO.password,{delay : 30});

    // click on login
    await page.waitForSelector(".ui-btn.ui-btn-large.ui-btn-primary.auth-button.ui-btn-styled");
    await page.click(".ui-btn.ui-btn-large.ui-btn-primary.auth-button.ui-btn-styled");

    // click on contest
    await page.waitForSelector('a[href="/contests"]');
    await page.click('a[href="/contests"]');

    //click on manage
    await page.waitForSelector('a[href="/administration/contests/"]');
    await page.click('a[href="/administration/contests/"]');

    //find no of pages
    await page.waitForSelector('a[data-attr1="Last"]');
    let numpages = await page.$eval('a[data-attr1="Last"]',function(atags){
        let np =  parseInt(atags.getAttribute("data-page"));

        return np;
    });

    // now Handle all contests in pages
    HandleContests(numpages,browser,page,configJSO);
    
}
async function HandleContests(numpages,browser,page,configJSO)
{
    for(let i=0;i<numpages;i++)
    {   
        //finding url of the contests
        let contest_urls = await FindingURLs(page,browser);

        //Run loop to go each contest on each page and add moderator
        for(let i=0;i<contest_urls.length;i++)
        {
            let cpage = await browser.newPage();
            await cpage.bringToFront();
            await cpage.goto(args.url+contest_urls[i]);
            await cpage.waitFor(2000);

            await Add_Moderator_in_contest(cpage,configJSO.moderator);

            await cpage.close();
            await page.waitFor(2000);
        }
        
        //click on next page
        await page.waitForSelector('a[data-attr1="Right"]');
        await page.click('a[data-attr1="Right"]');

    }
}
async function FindingURLs(page,browser)
{
    //finding url of the contests
    await page.waitForSelector('.backbone.block-center');
    let contest_urls = await page.$$eval('.backbone.block-center',function(atags){
        
        let urls =[];

        for(let i=0;i<atags.length;i++)
        {
            let url = atags[i].getAttribute("href");
            urls.push(url);
        }
        return urls;
    });
    return contest_urls;
}

async function Add_Moderator_in_contest(page,moderator)
{
    //click on moderators
    await page.waitForSelector('li[data-tab="moderators"]');
    await page.click('li[data-tab="moderators"]');

    await page.waitFor(1000);
    //type on moderator name
    await page.waitForSelector('#moderator');
    await page.type('#moderator',moderator,{delay:30});

    //Hit enter
    
    await page.keyboard.press('Enter');
    await page.waitFor(2000);
}
run();