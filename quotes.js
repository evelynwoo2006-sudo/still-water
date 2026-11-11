/* ==========================================================================
   quotes.js —— 随机引语
   数据只有一份：直接读页面里已经写好的那 18 个 <li class="quote">，
   随机抽一条塞进顶部 hero。所以关掉 JS 也仍然能看到全部句子。
   ========================================================================== */
(function () {
  "use strict";

  var hero = document.getElementById("randomQuote");
  var outText = document.getElementById("rqText");
  var outAuthor = document.getElementById("rqAuthor");
  var outTag = document.getElementById("rqTag");
  var outCount = document.getElementById("rqCount");
  var btn = document.getElementById("reroll");

  var items = document.querySelectorAll(".quote-list .quote");
  if (!hero || !items.length || !outText) return;

  var current = -1;

  function show(index) {
    var el = items[index];
    var textEl = el.querySelector(".quote-text");
    var author = el.getAttribute("data-author") || "";
    var source = el.getAttribute("data-source") || "";
    var tag = el.getAttribute("data-tag") || "";

    outText.textContent = textEl ? textEl.textContent.trim() : "";
    outAuthor.textContent = source ? author + " · " + source : author;

    if (tag) {
      outTag.textContent = tag;
      outTag.hidden = false;
    } else {
      outTag.hidden = true;
    }

    if (outCount) {
      outCount.textContent = "第 " + (index + 1) + " 句，共 " + items.length + " 句";
    }
  }

  function pick() {
    if (items.length === 1) return 0;
    var next = current;
    while (next === current) {
      next = Math.floor(Math.random() * items.length);
    }
    return next;
  }

  function reroll(animated) {
    var next = pick();
    current = next;

    if (!animated) {
      show(next);
      return;
    }

    hero.classList.add("is-swapping");
    window.setTimeout(function () {
      show(next);
      hero.classList.remove("is-swapping");
    }, 260);
  }

  current = Math.floor(Math.random() * items.length);
  show(current);

  if (btn) {
    btn.addEventListener("click", function () {
      reroll(true);
    });
  }

  // 键盘：按 R 也能换一句（不影响输入框）
  document.addEventListener("keydown", function (e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === "r" || e.key === "R") reroll(true);
  });
})();
