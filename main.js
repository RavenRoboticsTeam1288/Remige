$(document).ready(function() {
    var $body = $("body");
    var $form = $("#remige");
    var $formInputs = $("input", $form).prop("disabled", true); // Note: we cache this, so if you are dynamically adding in inputs don't cache it

    var $robotConnection = $("#robot-connection");
    var $serverConnection = $("#server-connection");

    function updateSeverConnection(str, onlyClass) {
        $serverConnection
            .html(str)
            .attr("class", "")
            .addClass(onlyClass);
    };

    var $imgs = [];
    function updateRobotConnection(str) {
        var cap = str.charAt(0).toUpperCase() + str.slice(1); // capitalize the first letter
        $robotConnection.html(cap);
        $robotConnection.addClass(str);

        for(var i = 0; i < $imgs.length; i++) {
            var $img = $imgs[i];
            $img
                .removeClass("errored")
                .attr("src", $img.realSRC); // reload
        }
    };

    function getFormData() {
        var data = {};
        for(var i = 0; i < $formInputs.length; i++) {
            var $input = $($formInputs[i]);

            if($input.attr("type") === "radio") { // then it has to be "checked" to be a value
                if(!$input.is(':checked')) {
                    continue;
                }
            }

            data[$input.attr("name")] = $input.val();
        }

        return data;
    };

    var $maximize = $("#maximize").on("click", function() {
        if($body.hasClass("maximized")) {
            $form.show();
        }
        else {
            setTimeout(function() {
                $form.hide();
            }, 1000);
        }

        setTimeout(function() {
            $body.toggleClass("maximized");
        }, 10);
    });

    updateSeverConnection("Connecting...", "connecting");
    $.getJSON("/config.json", function(config) {
        updateSeverConnection("Establishing WS Connection...", "connecting");

        var wsClient = new WebSocket("ws://" + window.location.hostname + ":" + config["ws_port"]);

        var updating = false; // poor man's mutex lock
        var connected = false;
        wsClient.onopen = function (e) {
            connected = true;
            updateSeverConnection("Connected", "connected");

            var send = function(data) {
                var str = JSON.stringify(data);
                console.log("SEND: -> " + str);
                wsClient.send(str);
            };

            $(document).on("change", "#remige", function() {
                if(!updating) {
                    send(getFormData());
                }
            });
        };

        wsClient.onmessage = function(e) {
            console.log("GOT: <- " + e.data);

            $formInputs.prop("disabled", false);

            var parsed;
            try {
                parsed = JSON.parse(e.data);
            }
            catch(err) {
                updateSeverConnection("Invalid JSON Sent", "disconnected");
                return;
            }

            updateRobotConnection(parsed.robot_status);

            updating = true;
            var newFormData = parsed.form;
            for(var key in newFormData) {
                if(newFormData.hasOwnProperty(key)) {
                    var value = newFormData[key];
                    var $input = $("input[name=" + key + "]");
                    if($input.attr("type") === "radio") {
                        $input.prop("checked", false);
                        $("input[value=" + value + "]").prop("checked", true);
                    }
                    else {
                        $input.val(value);
                    }
                }
            }
            updating = false;
        };

        wsClient.onerror = function() {
            console.log("socket errored");
            updateSeverConnection("Errored", "disconnected");
            $formInputs.prop('disabled', true);
        };

        wsClient.onclose = function() {
            console.log("connection closed");
            updateSeverConnection(connected ? "Connection Closed" : "Could Not Connect", "disconnected");
            $formInputs.prop('disabled', true);
        };

        if(config.image_streams) {
            var $streams = $("#streams");
            for(var i = 0; i < config.image_streams.length; i++) {
                var stream = config.image_streams[i];
                var title = stream.title || "Camera " + (i+1);

                var $img = $("<img>")
                    .attr("src", "http://" + config.robot_ip + ":" + stream.port + stream.path)
                    .attr("alt", title + " (OFFLINE)")
                    .attr("title", title)
                    .appendTo($streams)
                    .on("error", function(e) { // it failed to load, probably because we are disconnected from the Robot
                        $(this)
                            .attr("src", "/blank.png")
                            .addClass("errored");
                    });

                $img.realSRC = $img.attr("src");
                $imgs.push($img)
            }
        }
    });
});
