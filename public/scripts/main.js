var app = (function () {
    'use strict';

    var touchEvent;

    var touchEvents = function () {
        if (Modernizr.touch) {
            touchEvent = 'touchstart';
        } else {
            touchEvent = 'click';
        }
    };

    var navigation = function () {
        $('.nav-toggle').on('click', function (e) {
            e.preventDefault();
            $('.nav-toggle, .main-nav').toggleClass('active');
        });

        $('.nav-tabs a').on('click', function (e) {
            e.preventDefault();
            $(this).tab('show');
        });

        // $('.main-nav a, .next-slide').on(touchEvent, function (e) {
        //     e.preventDefault();
        //     var el = $(this).attr('href');
        //     //scrollToElement(el, 500, -55, 'ease');

        //     $('.main-nav a').parent().removeClass('active');
        //     $('.nav-toggle').removeClass('active');
        //     $('.main-nav a[href=' + el + ']').parent().addClass('active');
        // });

        // function scrollToElement (selector, time, verticalOffset) {
        //     time = typeof(time) !== 'undefined' ? time : 1000;
        //     verticalOffset = typeof(verticalOffset) !== 'undefined' ? verticalOffset : 0;
        //     var element = $(selector);
        //     var offset = element.offset();
        //     var offsetTop = offset.top + verticalOffset;
        //     $('html, body').animate({
        //         scrollTop: offsetTop
        //     }, time);
        // }


    };

    var init = function () {

        touchEvents();
        navigation();

    };

    return {
        init: init
    };

}());

$(function () {

    'use strict';
    app.init();

    if ($('#profile__chart').length) {
        // bar chart data
        var barData = {
            labels: ["01/08/14", "02/08/14", "03/08/14", "04/08/14", "05/08/14", "06/08/14", "07/08/14", "08/08/14", "09/08/14", "10/08/14", "11/08/14", "12/08/14", "13/08/14", "14/08/14"],
            datasets: [{
                fillColor: "#109ad6",
                strokeColor: "#109ad6",
                data: [456, 479, 0, 569, 702, 0, 456, 0, 324, 569, 702, 0, 10]
            }]
        };
        // get bar chart canvas
        var income = document.getElementById("profile__chart").getContext("2d");
        // draw bar chart
        new Chart(income).Bar(barData);
    }

    var ongoingClimb;
    $('.js-end').prop('disabled', true);
    $('.js-start').on('click', function (e) {
        ongoingClimb = {
            start: {
                time: new Date().getTime(),
                floor: 0
            }
        };
        $('.js-end').prop('disabled', false);
        e.preventDefault();
    });

    $('.js-end').on('click', function (e) {
        e.preventDefault();
        ongoingClimb.end = {
            time: new Date().getTime(),
            floor: 11
        };
        $.ajax({
            type: "POST",
            url: '/activity/stairs',
            data: ongoingClimb,
            success: function () {
                alert('submitted');
            },
            dataType: 'json'
        });
        $('.js-end').prop('disabled', true);
    });


});
