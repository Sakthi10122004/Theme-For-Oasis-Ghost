document.documentElement.classList.add("js-ready");
(function ($) {
    "use strict";

    /* =============================================================
       DOM LOCK: IMMEDIATE MUTATION OBSERVER
       Intercepts and hides raw [subitem] nodes before paint.
    ============================================================= */
    const hideRawNode = (node) => {
        if (node.nodeType === 1 && node.tagName === 'LI') {
            const text = node.textContent;
            if (text.includes('[subitem]') || text.includes('[has_child]')) {
                node.style.display = 'none';
                node.dataset.ghostLocked = "true";
            }
        }
    };

    document.querySelectorAll('.nebula-nav-horizontal li').forEach(hideRawNode);

    new MutationObserver((mutations) => {
        mutations.forEach((m) => {
            m.addedNodes.forEach((n) => {
                if (n.nodeType === 1) {
                    if (n.tagName === 'LI') hideRawNode(n);
                    if (n.querySelectorAll) n.querySelectorAll('li').forEach(hideRawNode);
                }
            });
        });
    }).observe(document.documentElement, { childList: true, subtree: true });

    function multiLevel(targetElement = "ul li", mLhasSubmenu = "mL-has-submenu", mLsubmenu = "mL-submenu") {
        let mLparentDetecttext = "[-]";
        let mLchildDetectText = "[--]";
        let mLdomArrayElement = [];
        let mLparentIndex = [];
        let mLparentLen = 0;

        $(`${targetElement} li`).each(function (index, element) {
            if ($(this).text().includes(mLparentDetecttext)) {
                mLparentIndex.push(index);
                mLparentLen++;

                $(this).push(element);
                if (!$(this).hasClass('menu-item-has-children')) {
                    $(this).addClass(mLhasSubmenu);
                }
                $(this).append(`<ul class="${mLsubmenu}"></ul>`);
            }
        });

        let elIndex;
        let lastMlElementText = $(`.${mLhasSubmenu}`).last().text();

        for (let i = 0; i < mLparentLen; i++) {
            elIndex = 0;

            $(`${targetElement} li`).each(function (index, element) {
                let mLsubitem = $(this).text().includes(mLchildDetectText);

                if (mLsubitem) {
                    if (elIndex + 1 >= mLparentIndex[i + 1] + 1) {
                        return false;
                    }

                    if (elIndex <= mLparentIndex[i + 1] || elIndex >= mLparentIndex[mLparentIndex.length - 1]) {
                        if (!mLparentIndex.includes(index)) {
                            mLdomArrayElement.push(element);
                            mLparentIndex.push(index);
                        }
                    }
                }
                elIndex++;
            });

            $(`.${mLhasSubmenu} ul.${mLsubmenu}:eq(${i})`).append(mLdomArrayElement);
            mLdomArrayElement = [];
        }

        let lastMlElementIndex = 0;
        let lastChildIndex = 0,
            lastChildElementText;

        $(`${targetElement} li`).each(function (index, element) {
            let lastMlElement = $(this).text().includes(lastMlElementText);

            if (lastMlElement) {
                if (!$(this).hasClass('mLlastPrentElement')) {
                    $(this).addClass('mLlastPrentElement');
                    lastChildElementText = $(this).parent().children('li').last().text();
                    lastMlElementIndex = index;
                }
            }

            if ($(this).text().includes(lastChildElementText)) {
                lastChildIndex = index;
            }

            if (lastMlElementIndex < index && lastMlElementIndex > 0) {
                $(this).addClass('mLlastChildElements');
                $(".mLlastPrentElement ul").append($(`.mLlastChildElements`));
                if (lastChildIndex == index) {
                    return false;
                }
            }
        });

        remove_text(mLhasSubmenu, mLparentDetecttext);
        remove_text('subitem', mLchildDetectText);
    }

    function remove_text(textClass, replacedText) {
        const mLhasSubmenuEL = $(`.${textClass}`);
        mLhasSubmenuEL.each(function () {
            $(this).css('display', '');
            $(this).find('li').css('display', '');

            if ($(this).find("> a:first").text().includes(replacedText)) {
                let textFull = $(this).find("> a:first").text();
                $(this).find("> a:first").text(textFull.replaceAll(replacedText, ""));
            }
        });
    }

    function initMobileMenu() {
        const $hamburger = $('.hamburger');
        const $mobileNav = $('.nebula-nav-horizontal');
        const $body = $('body');

        // 🔥 PREVENT MULTIPLE BINDS
        $hamburger.off('click.mobileMenu');
        $mobileNav.off('click.mobileMenu');
        $(document).off('click.mobileMenu');
        $(document).off('keydown.mobileMenu');

        if ($hamburger.length && $mobileNav.length) {
            $hamburger.on('click.mobileMenu', function (e) {
                e.stopPropagation();
                $(this).toggleClass('active');
                $mobileNav.toggleClass('active');
                $body.toggleClass('menu-open');
            });

            $mobileNav.on('click.mobileMenu', 'a', function (e) {
                // Fixed - submenu links MUST navigate
                if ($(this).closest('.ghost-submenu').length) {
                    return true;
                }

                // Parent item with children
                if ($(this).parent().hasClass('menu-item-has-children')) {
                    const href = $(this).attr('href');
                    // If it's a placeholder link (#), toggle instead of navigating
                    if (href === '#' || href === 'javascript:void(0)' || !href) {
                        e.preventDefault();
                        e.stopPropagation();
                        $(this).parent().toggleClass('open');
                        return false;
                    }
                }

                if ($(e.target).closest('svg').length > 0) {
                    return;
                }

                if (!$(this).parent().hasClass('menu-item-has-children')) {
                    $mobileNav.removeClass('active');
                    $hamburger.removeClass('active');
                    $body.removeClass('menu-open');
                }
            });

            $(document).on('click.mobileMenu', function (e) {
                if (!$mobileNav.is(e.target) && $mobileNav.has(e.target).length === 0 && !$hamburger.is(e.target)) {
                    $mobileNav.removeClass('active');
                    $hamburger.removeClass('active');
                    $body.removeClass('menu-open');
                }
            });

            $(document).on('keydown.mobileMenu', function (e) {
                if (e.key === 'Escape' && $mobileNav.hasClass('active')) {
                    $mobileNav.removeClass('active');
                    $hamburger.removeClass('active');
                    $body.removeClass('menu-open');
                }
            });

            // ✅ NEW: MOBILE SUBMENU TOGGLE HANDLER (Icon click)
            $mobileNav.on('click.mobileMenu', '.submenu-toggle', function (e) {
                e.preventDefault();
                e.stopPropagation();
                $(this).parent().toggleClass('open');
            });
        }
    }

    function ghost_dropdown(options) {
        let defultOptions = {
            targetElement: ".nebula-nav-horizontal ul li",
            hasChildrenClasses: "menu-item-has-children",
            hasChildDetectText: "[has_child]",
            hasChildrenIcon: "<svg width='19' height='10' viewBox='0 0 19 10' fill='none' xmlns='http://www.w3.org/2000/svg'><path d='M1.74805 1.52002L9.54883 9.00002L17.3496 1.52002' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/></svg>",
            submenuUlClasses: "ghost-submenu",
            subitemDetectText: "[subitem]",
            subitemLiClasses: "subitem"
        }

        options = {
            ...defultOptions,
            ...options
        }

        let targetElement = options.targetElement;
        let hasChildrenClasses = options.hasChildrenClasses;
        let hasChildDetectText = options.hasChildDetectText;
        let hasChildrenIcon = options.hasChildrenIcon;
        let submenuUlClasses = options.submenuUlClasses;
        let subitemDetectText = options.subitemDetectText;
        let subitemLiClasses = options.subitemLiClasses;

        let parentEl = $(targetElement);
        let childEL = $(targetElement);
        let parentLen = 0;
        let domArrayElement = [];
        let indexPush = [];
        let elIndex = 0;
        let parentIndex = [];

        $(`${targetElement}`).parent().addClass('ghost-dropdown-menu');

        parentEl.each(function (index, element) {
            if ($(this).text().indexOf(hasChildDetectText) >= 0) {
                parentIndex.push(index);
                parentLen++;

                $(this).push(element);
                $(this).addClass(hasChildrenClasses);
                $(this).append(`<ul class='${submenuUlClasses}'></ul>`);
            }
        });



        // ✅ RESTORE ORIGINAL SVG APPEND (DESKTOP SAFE)
        $(`.${hasChildrenClasses}`).append(hasChildrenIcon);

        // ✅ NEW: ADD TOGGLE BUTTON FOR MOBILE
        if ($('.nebula-nav-horizontal').length) {
            $(`.${hasChildrenClasses}`).each(function () {
                if (!$(this).find('.submenu-toggle').length) {
                    $(this).append('<button class="submenu-toggle" aria-label="Toggle Submenu"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></button>');
                }
            });
        }

        for (let i = 0; i < parentLen; i++) {
            elIndex = 0;

            childEL.each(function (index, element) {
                let subitem = $(this).text().includes(subitemDetectText);

                if (subitem) {
                    if (elIndex >= parentIndex[i + 1]) {
                        return false;
                    }

                    if (elIndex <= parentIndex[i + 1] || elIndex >= parentIndex[parentIndex.length - 1]) {
                        if (!indexPush.includes(index)) {
                            $(this).addClass(subitemLiClasses);
                            let st = $(this).children().text();
                            $(this).children().text(st.replaceAll(subitemDetectText, ""));
                            domArrayElement.push(element);
                            indexPush.push(index);
                        }
                    }
                }
                elIndex++;
            });

            $(`.${hasChildrenClasses} ul.${submenuUlClasses}:eq(${i})`).append(domArrayElement);
            domArrayElement = [];
        }
        remove_text(hasChildrenClasses, hasChildDetectText);

        if (options.multi_level) {
            multiLevel();
        }

        // ✅ REMOVED: initMobileDropdown() call
        initMobileMenu();
    }

    function initGhostDropdown() {
        const checkNavReady = setInterval(function () {
            const $nav = $('.nebula-nav-horizontal ul li');
            if ($nav.length > 3 && $nav.first().text().trim()) {
                clearInterval(checkNavReady);

                ghost_dropdown({
                    targetElement: ".nebula-nav-horizontal ul li",
                    hasChildrenClasses: "menu-item-has-children",
                    hasChildDetectText: "[has_child]",
                    submenuUlClasses: "ghost-submenu",
                    subitemDetectText: "[subitem]",
                    subitemLiClasses: "subitem",
                    multi_level: true,
                    mega_menu: false
                });

                const body = document.body;
                const nav = document.querySelector(".nebula-nav-horizontal");
                if (nav) nav.classList.add("nav-ready");
                body.classList.add("header-ready");
            }
        }, 0);
    }

    $(document).ready(function () {
        initGhostDropdown();
    });

}(jQuery));

$(window).on('load pageshow', function () {
    $('body').addClass('loaded');
});

setTimeout(() => {
    $('body').addClass('loaded');
}, 10);