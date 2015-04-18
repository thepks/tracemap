(function() {

    var app = angular.module('TraceAnalysisService', []);
    

    

    app.factory("TraceAnalysisService", function() {

        return {

            parse: function(file, threshold, reduction) {

                var call_list_stack = [];
                var working_stack = [];
                var object_stack = [];
                var target_stack = [];
                var call_obj = {};
                var object_stack_sum = 0;
                var net_value = 0;
                var gross_value = 0;
                var target_value = 0;
                var moving_object = {};
                var target_object = {};
                var line_list = file.split('\n');
                var first = true;
                var found = false;
                var thresh = threshold;

                /* Open and parse file */
                for (var l = 0; l < line_list.length; l++) {
                    if (line_list[l].trim().length < 1) {
                        continue;
                    }
                    if (first) { // First line describes file columns
                        first = false;
                        continue;
                    }

                    var fields = line_list[l].split(/\|/);
                    if (fields.length < 3) {
                        continue;
                    }
                    call_obj = {};
                    var itm = fields[1].replace(/,/g, '').trim();
                    call_obj.name = itm + '-' + fields[2];
                    call_obj.item = itm;

                    try {
                        call_obj.gross = parseInt(fields[3].replace(/,/g, ''), 10);
			    } catch(e) {}
			    try{
                        call_obj.net = parseInt(fields[4].replace(/,/g, ''), 10);
                    } catch (e) {call_obj.net = 0;}

			    if (isNaN(call_obj.net)) {
				call_obj.net = 0;
				}


                    if ('gross' in call_obj && 'net' in call_obj && 'name' in call_obj && !isNaN(call_obj.gross)) {

                        call_obj.true_net = call_obj.net;

                        /* push objects to the stack */
                        call_list_stack.push(call_obj);
                    }
                }

                /* while obj on the stack */

                while (call_list_stack.length > 0) {

                    /*shift to working stack */
                    moving_object = call_list_stack.pop();
                    net_value = moving_object.net;
                    gross_value = moving_object.gross;

                    // filter, don't try to describe less than the gross value threshold, just move to the output stack
                    if (gross_value < thresh || net_value >= gross_value) {
                        target_stack.push(moving_object);
                        continue;
                    }

                    target_object = moving_object;

                    /*check if accumulated value greater than top object gross time */
                    if (net_value < gross_value) {
                        // find items within here

                        /* form a new stack for the last object*/
                        object_stack = [];
                        object_stack_sum = target_object.net;
                        found = false;


                        while (target_stack.length > 0) {

                            moving_object = target_stack.pop();

                            try {
                                net_value = moving_object.net;
                            } catch (e) {
                                net_value = 0;
                                found = true;
                            }

                            if (object_stack_sum + net_value <= gross_value && !found) {
                                object_stack_sum += net_value;

                                if (!('children' in target_object)) {
                                    target_object.children = [];
                                    var clone_object = {};
                                    clone_object.name = target_object.name+"*";
                                    clone_object.item = target_object.item;
                                    clone_object.net = target_object.true_net;
                                    clone_object.gross = target_object.gross;
                                    target_object.children.push(clone_object);
                                }
                                target_object.children.push(moving_object);
                            } else {
                                target_stack.push(moving_object);
                                break;
                            }

                        }

                        target_object.net = object_stack_sum;

                    }

                    target_stack.push(target_object);
                }

                console.log('Tree formed');
                
                // To reduce need to find the ends and then if they are less that reduce level consume them
                

                return target_stack;

            }

        };
    });
})();