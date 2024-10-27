import { test, expect, TestInfo, Page } from "@playwright/test";

// No output on the console is desired
test.beforeEach(async ({ page }) => {
    page.on("console", msg => {
        throw new Error(`Output printed to console:\n${msg.text()}`);
    });
});

/** Project names (as defined in playwright.config.ts) that are not expected to support WebGPU. */
const webGpuUnsupported = ["Firefox"];

/**
 * Takes a screenshot of the current page and compares it to a reference, as indexed by the given arguments.
 * If a reference screenshot does not exist, it will be created and used for future assertions.
 *
 * @param page
 * @param info
 * @param name A name that identifies this test.
 * @param api The API used in the test, either `"webgl"` or `"webgpu"`.
 * @param number A number identifying the specific screeenshot within the test, if multiple are included.
 */
async function assertScreenshot(
    page: Page,
    info: TestInfo,
    name: string,
    api: "webgl" | "webgpu",
    number?: number,
) {
    const projectName = info.project.name;
    const isMobile = info.project.use.isMobile ?? false;

    const mobileString = isMobile ? "-mobile" : "";
    const numberString = number ? `-${number}` : "";

    const isWebGpu = api === "webgpu";
    const isWebGpuUnsupported = webGpuUnsupported.includes(projectName);
    const unsupportedString =
        isWebGpu && isWebGpuUnsupported ? "-unsupported" : "";

    const fileName = `${name}-${api}${unsupportedString}${mobileString}${numberString}.png`;

    await expect.soft(page).toHaveScreenshot(fileName, {
        // Allow for slightly different rendering on different platforms,
        // since Chrome and Firefox have slightly different text-rendering and inputs etc.
        maxDiffPixelRatio: 0.01,
    });
}

const apis = ["webgl", "webgpu"] as const;
apis.forEach(api => {
    test(`Hello world [${api}]`, async ({ page }, info) => {
        const pageName = "hello-world";

        await page.goto(`/${pageName}/${api}`);
        await assertScreenshot(page, info, pageName, api);
    });

    test(`Remounting canvas [${api}]`, async ({ page }, info) => {
        const pageName = "remount";

        await page.goto(`/${pageName}/${api}`);
        let show = page.getByLabel("Show");
        await show.uncheck();
        await assertScreenshot(page, info, pageName, api, 1);
        for (let i = 0; i < 10; i++) {
            await show.check();
            await show.uncheck();
        }
        await show.check();
        await assertScreenshot(page, info, pageName, api, 2);
    });

    test(`Oversized canvas [${api}]`, async ({ page }, info) => {
        const pageName = "oversized-canvas";

        await page.goto(`/${pageName}/${api}`);
        await assertScreenshot(page, info, pageName, api, 1);
        // Scroll to bottom-right corner
        await page.evaluate(() =>
            window.scrollBy(
                document.body.scrollWidth,
                document.body.scrollHeight,
            ),
        );
        await assertScreenshot(page, info, pageName, api, 2);
    });

    test(`Logo [${api}]`, async ({ page }, info) => {
        const pageName = "logo";

        await page.goto(`/${pageName}/${api}`);
        await assertScreenshot(page, info, pageName, api);
    });

    test(`Landing page with bubbles [${api}]`, async ({ page }, info) => {
        const pageName = "landing-page-bubbles";

        await page.goto(`/${pageName}/${api}`);
        await assertScreenshot(page, info, pageName, api);
    });

    test(`Landing page with a halo [${api}]`, async ({ page }, info) => {
        const pageName = "landing-page-halo";

        await page.goto(`/${pageName}/${api}`);
        await assertScreenshot(page, info, pageName, api);
    });

    test(`Slider component [${api}]`, async ({ page }, info) => {
        const pageName = "slider";

        await page.goto(`/${pageName}/${api}`);
        const slider = page.getByRole("slider");
        await assertScreenshot(page, info, pageName, api, 1);
        slider.fill("1");
        await assertScreenshot(page, info, pageName, api, 2);
        slider.fill("0");
        await assertScreenshot(page, info, pageName, api, 3);
    });
});
