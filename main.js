$(document).ready(function() {
    var $body = $("body");
    var $form = $("#remige");
    var $formInputs = $("input", $form); // Note: we cache this, so if you are dynamically adding in inputs don't cache it

    var $robotConnection = $("#robot-connection");
    var $serverConnection = $("#server-connection");

    function updateSeverConnection(str) {
        $serverConnection.html(str);
    };

    var $imgs = [];
    function updateRobotConnection(str) {
        str = str.charAt(0).toUpperCase() + str.slice(1); // capitalize the first letter
        $robotConnection.html(str);
        for(var i = 0; i < $imgs.length; i++) {
            var $img = $imgs[i];
            $img.attr("src", $img.attr("src")); // reload
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
        $body.toggleClass("maximized");
    });

    updateSeverConnection("Connecting...");
    $.getJSON("/config.json", function(config) {
        updateSeverConnection("Establishing WS Connection...");

        var wsClient = new WebSocket("ws://localhost:" + config["ws_port"]);

        var updating = false; // poor man's mutex lock
        wsClient.onopen = function (e) {
            updateSeverConnection("Connected");

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

            var parsed;
            try {
                parsed = JSON.parse(e.data);
            }
            catch(err) {
                updateSeverConnection("Sent invalid JSON...");
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
            updateSeverConnection("Errored");
            $formInputs.prop('disabled', true);
        };

        wsClient.onclose = function() {
            console.log("connection closed");
            updateSeverConnection("Closed");
            $formInputs.prop('disabled', true);
        };

        
        if(config.image_streams) {
            var $streams = $("#streams");
            for(var i = 0; i < config.image_streams.length; i++) {
                var steam = config.image_streams[i];

                $imgs.push($("<img>")
                    .attr("src", "http://" + config.robot_ip + ":" + steam.port + steam.path)
                    .appendTo($streams)
                );
            }
        }
    });
});
