/* letter — placeholder */
Aleove.registerScene("letter", {
  mount: function (root) { root.innerHTML = '<p style="position:absolute;inset:0;display:grid;place-items:center;color:#fff">letter</p>'; },
  play: function (ctx) { return "letter" === "flower" ? ctx.waitForScrollUp() : new Promise(function(r){ setTimeout(r, 1500); }); }
});
