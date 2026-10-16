/* flower — placeholder */
Aleove.registerScene("flower", {
  mount: function (root) { root.innerHTML = '<p style="position:absolute;inset:0;display:grid;place-items:center;color:#fff">flower</p>'; },
  play: function (ctx) { return "flower" === "flower" ? ctx.waitForScrollUp() : new Promise(function(r){ setTimeout(r, 1500); }); }
});
