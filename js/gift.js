/* gift — placeholder */
Aleove.registerScene("gift", {
  mount: function (root) { root.innerHTML = '<p style="position:absolute;inset:0;display:grid;place-items:center;color:#fff">gift</p>'; },
  play: function (ctx) { return "gift" === "flower" ? ctx.waitForScrollUp() : new Promise(function(r){ setTimeout(r, 1500); }); }
});
