export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "public": "/" });
  eleventyConfig.addFilter("isoDate", (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    return isNaN(dt) ? "" : dt.toISOString().slice(0, 10);
  });
  eleventyConfig.addFilter("niceDate", (d) => {
    const dt = d instanceof Date ? d : new Date(d);
    return isNaN(dt) ? "" : dt.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
  });
  return {
    dir: { input: "content", includes: "../_includes", output: "_site" },
    markdownTemplateEngine: false,
    htmlTemplateEngine: "njk"
  };
}
