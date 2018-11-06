import * as fs from 'fs';
import * as Koa from 'koa';
import * as KoaPinoLogger from 'koa-pino-logger';
import * as KoaRouter from 'koa-router';
import * as KoaStatic from 'koa-static';
import * as os from 'os';
import * as path from 'path';
import * as Pino from 'pino';
import { URL } from "url";

const HOME_PAGE = process.env['HOME_PAGE'] || 'https://github.com/VectorLogoZone/vlz-404';

const app = new Koa();
app.proxy = true;

const logger = Pino();

app.use(KoaPinoLogger({ logger: logger }));

const ar21svg = fs.readFileSync(path.join(__dirname, '..', 'assets', '404-ar21.svg'), { encoding: 'utf-8'});
const iconsvg = fs.readFileSync(path.join(__dirname, '..', 'assets', '404-icon.svg'), { encoding: 'utf-8'});
const fullsvg = fs.readFileSync(path.join(__dirname, '..', 'assets', '404-full.svg'), { encoding: 'utf-8'});

app.use(async(ctx, next) => {
    try {
        await next();
        const status = ctx.status || 404;
        if (status === 404) {
            ctx.log.warn( { url: ctx.request.url }, 'File not found');
            const url = new URL(ctx.request.url, 'https://localhost/');

            ctx.type = 'image/svg+xml';
            if (url.pathname.endsWith('-ar21.svg')) {
                ctx.body = ar21svg;
            } else if (url.pathname.endsWith('-icon.svg')) {
                ctx.body = iconsvg;
            } else {
                ctx.body = fullsvg;
            }
        }
    } catch (err) {
        ctx.log.error( { err, url: ctx.request.url }, 'Server Error');
        ctx.status = 500;
        ctx.body = '500: Server error';
    }
});

app.use(KoaStatic('static'));

const rootRouter = new KoaRouter();

rootRouter.get('/', (ctx) => {
    ctx.body = 'would redirect to ' + HOME_PAGE;
});

rootRouter.get('/status.json', async (ctx: Koa.Context) => {
    const retVal: {[key:string]: any } = {};

    retVal["success"] = true;
    retVal["message"] = "OK";
    retVal["timestamp"] = new Date().toISOString();
    retVal["lastmod"] = process.env['LASTMOD'] || null;
    retVal["commit"] = process.env['COMMIT'] || null;
    retVal["__dirname"] = __dirname;
    retVal["__filename"] = __filename;
    retVal["os.hostname"] = os.hostname();
    retVal["os.type"] = os.type();
    retVal["os.platform"] = os.platform();
    retVal["os.arch"] = os.arch();
    retVal["os.release"] = os.release();
    retVal["os.uptime"] = os.uptime();
    retVal["os.loadavg"] = os.loadavg();
    retVal["os.totalmem"] = os.totalmem();
    retVal["os.freemem"] = os.freemem();
    retVal["os.cpus.length"] = os.cpus().length;
    // too much junk: retVal["os.networkInterfaces"] = os.networkInterfaces();

    retVal["process.arch"] = process.arch;
    retVal["process.cwd"] = process.cwd();
    retVal["process.execPath"] = process.execPath;
    retVal["process.memoryUsage"] = process.memoryUsage();
    retVal["process.platform"] = process.platform;
    retVal["process.release"] = process.release;
    retVal["process.title"] = process.title;
    retVal["process.uptime"] = process.uptime();
    retVal["process.version"] = process.version;
    retVal["process.versions"] = process.versions;

    const callback = ctx.request.query['callback'];
    if (callback && callback.match(/^[$A-Za-z_][0-9A-Za-z_$]*$/) != null) {
        ctx.body = callback + '(' + JSON.stringify(retVal) + ');';
    } else {
        ctx.body = JSON.stringify(retVal);
    }
});

app.use(rootRouter.routes());

/*
app.use(async(ctx, next) => {
    if (ctx.request.url.startsWith('/logo/')) {
        ctx.type = 'text/plain; charset=utf-8';
        ctx.body = 'Custom SVG would be served for "' + ctx.request.url + '"';
    } else {
        await next();
    }
});
*/

const listener = app.listen(process.env.PORT || "4000", function () {
    logger.info( { address: listener.address() }, 'Running');
});
