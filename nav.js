/* ==========================================================================
   nav.js —— 全站导航只写一次，注入每个页面
   1. 抓取 nav.html 并注入 #site-nav 容器（fetch 失败时用内置备份，保证 file:// 直接打开也能用）
   2. 根据 body[data-page] 标记当前页
   3. 手机端汉堡菜单 + 明暗模式切换（记忆在 localStorage）
   ========================================================================== */
(function () {
  "use strict";

  var mount = document.getElementById("site-nav");
  if (!mount) return;

  /* 与 nav.html 保持一致的兜底版本，仅在无法 fetch（例如直接双击本地文件）时使用 */
  var FALLBACK =
    '<a class="brand" href="index.html" aria-label="静水 · 回到首页">' +
    '<span class="brand-mark" aria-hidden="true">◍</span>' +
    '<span class="brand-name">静水</span>' +
    '<span class="brand-sub">still water</span></a>' +
    '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav-list" aria-label="打开导航菜单"><span></span><span></span></button>' +
    '<nav class="site-nav" id="site-nav-list" aria-label="主导航"><ul>' +
    '<li><a href="index.html" data-page="index">首页</a></li>' +
    '<li><a href="quotes.html" data-page="quotes">句子</a></li>' +
    '<li><a href="project.html" data-page="project">项目</a></li>' +
    '<li><a href="machine.html" data-page="machine">机器</a></li>' +
    "</ul>" +
    '<button class="theme-toggle" type="button" aria-pressed="false" aria-label="切换明暗模式"><span aria-hidden="true"></span></button>' +
    "</nav>";

  function enhance() {
    // --- 当前页高亮 ---
    var page = document.body.getAttribute("data-page");
    var links = mount.querySelectorAll(".site-nav a[data-page]");
    for (var i = 0; i < links.length; i++) {
      if (links[i].getAttribute("data-page") === page) {
        links[i].classList.add("is-active");
        links[i].setAttribute("aria-current", "page");
      }
    }

    // --- 手机端菜单 ---
    var toggle = mount.querySelector(".nav-toggle");
    var bar = mount;

    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = bar.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
        toggle.setAttribute("aria-label", open ? "关闭导航菜单" : "打开导航菜单");
      });

      var navLinks = mount.querySelectorAll(".site-nav a");
      for (var j = 0; j < navLinks.length; j++) {
        navLinks[j].addEventListener("click", function () {
          bar.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      }

      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && bar.classList.contains("is-open")) {
          bar.classList.remove("is-open");
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      });
    }

    // --- 明暗模式 ---
    var themeBtn = mount.querySelector(".theme-toggle");
    if (themeBtn) {
      var sync = function () {
        var dark = document.documentElement.getAttribute("data-theme") === "dark";
        themeBtn.setAttribute("aria-pressed", dark ? "true" : "false");
        themeBtn.setAttribute("aria-label", dark ? "切换到浅色模式" : "切换到深色模式");
      };

      sync();

      themeBtn.addEventListener("click", function () {
        var dark = document.documentElement.getAttribute("data-theme") === "dark";
        if (dark) {
          document.documentElement.removeAttribute("data-theme");
        } else {
          document.documentElement.setAttribute("data-theme", "dark");
        }
        try {
          localStorage.setItem("sw-theme", dark ? "light" : "dark");
        } catch (e) {}
        sync();
      });
    }

    document.body.classList.add("nav-ready");
  }

  fetch("nav.html", { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    })
    .then(function (html) {
      mount.innerHTML = html;
      enhance();
    })
    .catch(function () {
      mount.innerHTML = FALLBACK;
      enhance();
    });
})();
