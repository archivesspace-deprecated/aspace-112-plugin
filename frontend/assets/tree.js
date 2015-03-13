
$(function() {
  	var $tree = $("#archives_tree"),
    $container = $("#object_container"),
    $toolbar = $("#archives_tree_toolbar");


  if ($tree.length > 0) {

    var config = {
      root_object_id: $tree.data("root-id"),
      root: $tree.data("root"),
      root_node_type: $tree.data("root-node-type"),
      read_only: $(".archives-tree").data("read-only"),
      rules: $(".archives-tree").data("rules")
    };
    var initForm = function(html) {
      $container.html(html);
      

      var $form = $("form", $container);
      
      
      $(".btn-cancel", $form).html(AS.renderTemplate("tree_revert_changes_label_template"));

      if (location.hash !== "#tree::new") {
        $form.data("form_changed", false);
        $(".btn-primary", $form).attr("disabled", "disabled");
        $(".btn-cancel", $form).attr("disabled", "disabled");
      } else {
        $form.data("form_changed", true);
      }

      $form.bind("formchanged.aspace", function() {
        $(".btn-primary", $form).removeAttr("disabled");
        $(".btn-cancel", $form).removeAttr("disabled");
      });

      $(".btn-plus-one", $form).click(function() {
        var createPlusOne = function(event, data) {
          if (data.success) {
            $(".archives-tree-container .add-sibling").trigger("click");
          }
        };

        $form.data("createPlusOne", true);

        $container.one("submitted", createPlusOne);
        $form.triggerHandler("submit");
      });

      $(".btn-cancel", $form).click(function() {
        // scroll back to the top
        $.scrollTo("header")
      });

      // Move the loadedrecordform.aspace event to be before
      // the ajaxForm is attached, so events (like the session check)
      // can be bound to the form first.
      $(document).triggerHandler("loadedrecordform.aspace", [$container]);
      
      
      $form.ajaxForm({
        data: {
          inline: true
        },
        beforeSubmit: function(arr, $form) {
          $(".btn-primary", $form).attr("disabled","disabled");

          if ($form.data("createPlusOne")) {
            arr.push({
              name: "plus_one",
              value: "true",
              required: false,
              type: "text"
            });
          }
        },
        success: function(response, status, xhr) {
          var $form = initForm(response);
          

          if ($container.find(".form-messages .alert-error:first, .form-messages .alert-warning:first").length) {
            $container.triggerHandler("submitted", {success: false});
            $form.data("form_changed", true);
            $(".btn-primary, .btn-cancel", $form).removeAttr("disabled");
          } else {
            $form.data("form_changed", false);

            $container.triggerHandler("submitted", {success: true});
          }
          
          if ( $form.data('"update-monitor-paused"') ) {
            $form.data("update-monitor-paused", false);
          }

          // scroll back to the top
          $.scrollTo("header");
        },
        error: function(obj, errorText, errorDesc) {
          $container.prepend("<div class='alert alert-error'><p>An error occurred saving this record.</p><pre>"+errorDesc+"</pre></div>");
          $container.triggerHandler("submitted", {success: false});
          $(".btn-primary", $form).removeAttr("disabled");
        }
      });

      AS.resetScrollSpy();
      
      

      return $form;
    };

    var insertLoadingMessage = function() {
      var loadingMsgEl = $(AS.renderTemplate("tree_loading_notice_template"));
      loadingMsgEl.hide();
      $container.prepend(loadingMsgEl);
      loadingMsgEl.fadeIn();
      $(":input", $container).attr("disabled","disabled");
    };


    var getPrimarySelectedNode = function() {
      return $(".primary-selected", $tree);
    };

    var getSelectedNodes = function() {
      return $tree.jstree("get_selected");
    };

    var clearSelected = function(includingPrimary) {
      if (includingPrimary) {
        $tree.jstree("deselect_all");
      } else {
        $tree.jstree("deselect_node", $(".selected:not(.primary-selected)", $tree));
        $(".selected:not(.primary-selected)", $tree).removeClass("selected");
      }
    };

    var loadPaneForNode = function(nodeEl) {
      insertLoadingMessage();

      if (config.read_only) {

        var params = {};
        params.inline = true;
        params[config.root_node_type+"_id"] = config.root_object_id;

        $.ajax({
          url: APP_PATH+nodeEl.attr("rel")+"s/"+nodeEl.data("id"),
          type: 'GET',
          data: params,
          success: function(html) {
            $container.html(html);
            AS.resetScrollSpy();
            $(document).trigger("loadedrecordform.aspace", [$container]);
          },
          error: function(obj, errorText, errorDesc) {
            $container.html("<div class='alert alert-error'><p>An error occurred loading this form.</p><pre>"+errorDesc+"</pre></div>");
          }
        });

        return;
      }

      if (nodeEl.attr("id") === "new") {

        var data = {
          inline: true
        };
        data[config.root_node_type + "_id"] = config.root_object_id;

        var $parentNodeEl = nodeEl.parents("li:first");
        if ($parentNodeEl.attr("rel") === nodeEl.attr("rel")) {
          data[$parentNodeEl.attr("rel") + "_id"] = $parentNodeEl.data("id");
        }

        if (nodeEl.data("params")) {
          data = $.extend({}, data, nodeEl.data("params"));
        }

        $.ajax({
          url: APP_PATH + nodeEl.attr("rel") + "s/new",
          data: data,
          type: "GET",
          success: function(html) {
            initForm(html);
            $("form", $container).triggerHandler("formchanged.aspace");
          },
          error: function() {
            $container.html("<div class='alert alert-error'><p>An error occurred loading this form.</p><pre>"+errorDesc+"</pre></div>");
            console.log("ERROR! $('.archives-tree-container').on('click', '.add-child')");
          }
        });
      } else if (nodeEl.attr("rel")) {
        $.ajax({
          url: APP_PATH+nodeEl.attr("rel")+"s/"+nodeEl.data("id")+"/edit?inline=true",
          success: function(html) {
            initForm(html);
          },
          error: function(obj, errorText, errorDesc) {
            $container.html("<div class='alert alert-error'><p>An error occurred loading this record.</p><pre>"+errorDesc+"</pre></div>");
          }
        });
      }
    };


    var renderTreeNodeNavigation = function(event) {
      var currentNodeEl = getPrimarySelectedNode();
      if (currentNodeEl.length === 0) {
        return;
      }

      var allNodes = $tree.find("li");
      var indexOfCurrentNode = allNodes.index(currentNodeEl);
      var data = {
        config: config
      };
      if (indexOfCurrentNode !== 0) {
        data.previous = allNodes.get(indexOfCurrentNode-1).id;
      }
      if (indexOfCurrentNode+1 < allNodes.length) {
        data.next = allNodes.get(indexOfCurrentNode+1).id;
      }

      var x = $(".btn-toolbar", $toolbar).append(AS.renderTemplate("tree_nodenavigation_toolbar_template", data));
    };


    var loadTreeActionsForNode = function(nodeEl) {
      // render tree toolbar
      $toolbar.html(AS.renderTemplate("tree_toolbar_template"));
      renderTreeNodeNavigation();
      if (config.read_only !== true && nodeEl.attr("id") != "new") {
        var data_for_toolbar = {
          config: config,
          rules: config.rules[nodeEl.attr("rel")],
          node: nodeEl,
          node_id: nodeEl.data('id'),
          root_object_id: config.root_object_id
        };
        if (nodeEl.parents("li").length) {
          data_for_toolbar.parent = nodeEl.parent().closest("li");
          data_for_toolbar.siblings = nodeEl.siblings("li").map(function(e) {
            return {
              id: $(this).attr("id"),
              title: $("a:first", this).attr("title")
            };
          }).toArray();
        }

        var toolbar_actions = $(AS.renderTemplate("tree_nodeactions_toolbar_template", data_for_toolbar));
        $(".btn-toolbar", $toolbar).append(toolbar_actions);

        var finish_action = $(AS.renderTemplate("tree_finish_action_template", data_for_toolbar));
        $(".btn-toolbar", $toolbar).append(finish_action);

        $('a', $toolbar).on("focus", function() {
          if ($(this).parents("li.dropdown-submenu").length) {
            $('.dropdown-menu', $(this).parent()).show();
          } else {
            $(".dropdown-submenu .dropdown-menu", $(this).parents(".nav")).css("display", "");
          }
        });
        $('.dropdown-submenu > a', $toolbar).on("keyup", function(event) {
          // right arrow focuses submenu
          if (event.keyCode === 39) {
            $('.dropdown-menu a:first', $(this).parent()).focus();
          }
        });
        $('.dropdown-submenu > .dropdown-menu > li > a', $toolbar).on("keyup", function() {
          // left arrow focuses parent menu
          if (event.keyCode === 37) {
            $("> a", $(this).parents(".dropdown-submenu:first")).focus();
          }
        });

        // init the cut and paste actions
        // if ($tree.data("clipboard")) {
        //   // disable paste if current node is a child
        //   if (nodeEl.closest($tree.data("clipboard")).length === 0) {
        //     $(".paste-node", $toolbar).removeAttr("disabled");
        //   }
        // }
        // $(".cut-node", $toolbar).removeAttr("disabled");

        // toggle action disabled/enabled based on status of tree
        enableDisableToolbarActions();

        // init any widgets in the newly rendered toolbar
        $(document).trigger("loadedrecordform.aspace", [$toolbar]);
      }
    };


    var setHashForNode = function(node_id) {
      if (node_id.indexOf("tree::") < 0) {
        node_id = "tree::"+node_id;
      }
      location.hash = node_id;
    };


    var changeHashSilently = function(newHash) {
      $(window).data("ignore-hashchange", true);
      location.hash = newHash;
    };


    var onHashChange = function(){
      var currentlyFocusedSelector;

      // if a toolbar action is clicked, let's refocus it
      // up re-render (it will be replaced with a new toolbar
      // for the selected node)
      if ($(":focus").length > 0 && $(":focus").closest($toolbar).length > 0) {
        currentlyFocusedSelector = $(":focus").attr("class");
      }

      if ($(window).data("ignore-hashchange")) {
        $(window).data("ignore-hashchange", false);
        return;
      }

      if (!location.hash || location.hash.indexOf("tree::") === -1) {
        return;
      }

      var id_from_hash = location.hash.replace("tree::", "");

      if ($("form", $container).data("form_changed")) {
        confirmChanges($(id_from_hash));
        changeHashSilently("#tree::"+getPrimarySelectedNode().attr("id"));
        return;
      }

      var $selected = $(id_from_hash);
      getPrimarySelectedNode().removeClass("primary-selected");
      $selected.addClass("primary-selected").addClass("selected");
      $tree.jstree("deselect_all");
      $tree.jstree("open_node", $selected);
      $tree.jstree("select_node", $selected);

      loadPaneForNode($selected);
      loadTreeActionsForNode($selected);

      if (currentlyFocusedSelector) {
        var $target = $("[class='"+currentlyFocusedSelector+"']");

        if ($target.is("[disabled]")) {
          $(".btn:not([disabled]):first", $toolbar).focus();
        } else {
          $("[class='"+currentlyFocusedSelector+"']").focus();
        }
      }
    };



    var addnewNode = function(parentNode, newNodeType,  newNodeConfig, new_object_params) {
      $tree.jstree("create_node", parentNode, "last", {"attr":{"id": "new"}, "data": {"title": newNodeConfig.record_label}});
      $("#new", $tree).addClass("new").attr("rel", newNodeType).data("params", new_object_params || {});
      $("#new", $tree).find("a").attr("href", "#new");
      $("#new", $tree).find("a").addClass('glyphicon glyphicon-asterisk');

      setHashForNode("new");
    };


    var resizeArchivesTree = function() {
      var height = $("#archives_tree").parent().height() - $toolbar.outerHeight() - 21;
      $("#archives_tree").height(height);
    };


    var enableDisableToolbarActions = function() {
      if (getSelectedNodes().length === 1) {
        $(".move-node.move-node-up, .move-node.move-node-down", $toolbar).removeAttr("disabled").removeClass("disabled");
      } else {
        $(".move-node.move-node-up, .move-node.move-node-down", $toolbar).attr("disabled", "disabled").addClass("disabled");
      }
    };


    var addTreeEventBindings = function() {

      $(".archives-tree-container").on("click", ".add-child", function() {
        var $selected = getPrimarySelectedNode();
        if ($selected.length === 0) {
          return;
        }

        addnewNode($selected, $(this).attr("rel"), config.rules[getPrimarySelectedNode().attr("rel")].can_add_child);
      });

      $(".archives-tree-container").on("click", ".add-sibling", function() {
        var $selected = getPrimarySelectedNode();
        if ($selected.length === 0) {
          return;
        }

        addnewNode($selected.parents("li:first"), $(this).attr("rel"), config.rules[$selected.parents("li:first").attr("rel")].can_add_child);
      });

      $container.on("click", ".btn-cancel", function(event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        if ($(this).attr("disabled")) {
          return;
        }

        if (getPrimarySelectedNode().attr("id") === "new") {
          setHashForNode(getPrimarySelectedNode().parents("li:first").attr("id"));
        } else {
          loadPaneForNode(getPrimarySelectedNode());
        }
      });

      $(".archives-tree-container").on("click", ".expand-tree .btn", function() {
        $(".archives-tree-container").addClass("expanded");
        $(".archives-tree-container").animate({
          width: $(".archives-tree-container").parents(".container:first").width()-5
        }, 500);
      });

      $(".archives-tree-container").on("click", ".retract-tree .btn", function() {
        $(".archives-tree-container").animate({
          width: $(".archives-tree-container").parent().width()
        }, 500, function() {
          $(".archives-tree-container").removeClass("expanded");
          $(".archives-tree-container").css("width", "auto");
        });
      });

      $(".archives-tree-container").on("click", ".move-node", function(event) {
       
        
        event.preventDefault();
        event.stopPropagation();

        var $selected = getPrimarySelectedNode();
        if ($selected.length === 0 || $(this).hasClass("disabled") || $(this).attr("disabled")==="disabled") {
          return;
        }

        var target_index = $(this).data("target-index") || 0;

        // check if target node is one of the selected nodes
        if (getSelectedNodes().is("#" + $(this).data("target-node-id"))) {
          // ok it is selected.
          // let's deselect it and allow the rest of the selection to be moved
          // into it.
          $tree.jstree("deselect_node", "#" + $(this).data("target-node-id"));
        }

        $tree.jstree("move_node", getSelectedNodes(), "#" + $(this).data("target-node-id"), target_index);

        $("a:first", $selected).focus();
      });
      // disable the move-node-up and move-node-down actions when multiple nodes are selected
      // (as behaviour of such actions is unclear when nodes are selected across branches)
      $tree.on("treemultipleselected.aspace", function() {
        enableDisableToolbarActions();
      }).on("treesingleselected.aspace", function() {
        enableDisableToolbarActions();
      });

      // TRANSFER STUFF
      $(".archives-tree-container").on("click", ".transfer-node", function(event) {
        if ($(".tree-transfer-form", ".archives-tree-container")[0].style.display === "block") {
          $(".tree-transfer-form", ".archives-tree-container").css("display", "");
          $(".missing-ref-message", ".archives-tree-container .tree-transfer-form form").hide();
          $(".token-input-dropdown").hide();
        } else {
          $(".tree-transfer-form", ".archives-tree-container").css("display", "block");
          $(".tree-transfer-form form", ".archives-tree-container").unbind("submit").submit(function(event) {
            if ($(this).serializeObject()['transfer[ref]']) {
              // continue with the POST
              return;
            } else {
              event.stopPropagation();
              event.preventDefault();

              $(".missing-ref-message", ".archives-tree-container .tree-transfer-form form").show();
              return true;
            }
          });
          setTimeout(function() {
            $("#token-input-transfer_ref_", ".archives-tree-container").focus();
          });
        }
      });
      $(".archives-tree-container").on("click", ".tree-transfer-form :input", function(event) {
        event.stopPropagation();
      });
      $(".archives-tree-container").on("click", ".tree-transfer-form .dropdown-toggle", function(event) {
        event.stopPropagation();
        $(this).parent().toggleClass("open");
      });
      $(".archives-tree-container").on("click", ".tree-transfer-form .btn-cancel", function(event) {
        $(".tree-transfer-form", ".archives-tree-container").css("display", "");
        $(".transfer-node", ".archives-tree-container").parent().removeClass("open");
      });

      // Cut and Paste
      $(".archives-tree-container").on("click", ".cut-node", function(event) {
        event.preventDefault();
        if ($(this).hasClass("disabled")) {
          return;
        }
        var $selected = getSelectedNodes();

        $(".cut-to-clipboard", $tree).removeClass("cut-to-clipboard");

        $selected.addClass("cut-to-clipboard");
        $tree.data("clipboard", $selected);
        $(this).addClass("disabled").addClass("btn-success");
      }).on("click", ".paste-node", function(event) {
          event.preventDefault();
          if ($(this).hasClass("disabled") || !$tree.data("clipboard")) {
            return;
          }

          var $target = getPrimarySelectedNode();

          $tree.jstree("move_node", $tree.data("clipboard"), "#"+$target.attr("id"));
          $tree.data("clipboard", null);
          $(this).addClass("disabled");
          $(".cut-to-clipboard", $tree).removeClass("cut-to-clipboard");
        });

      // Rapid Data Entry
      $(".archives-tree-container").on("click", ".add-children", function() {
        var $selected = getPrimarySelectedNode();
        if ($selected.length === 0) {
          return;
        }

        $(document).triggerHandler("rdeshow.aspace", [$selected, $(this)]);
      });


      $(window).hashchange(onHashChange);


      $("#archives_tree").scroll(function() {
        if ($(this).scrollTop() === 0) {
          $(this).removeClass("overflow");
        } else {
          $(this).addClass("overflow");
        }
      });

      if (AS.prefixed_cookie("archives-tree-container::height")) {
        $(".archives-tree-container").height(AS.prefixed_cookie("archives-tree-container::height"));
      } else {
        $(".archives-tree-container").height(AS.DEFAULT_TREE_PANE_HEIGHT);
      }

      $(".archives-tree-container").resizable({
        handles: "s",
        minHeight: 80,
        resize: function(event, ui) {
          AS.prefixed_cookie("archives-tree-container::height", ui.size.height);
          resizeArchivesTree();
          $(window).triggerHandler("resize.tree");
        }
      });

    };

    var moveNodes = function(jstreeMoveData) {
      var targetNodeEl = $(jstreeMoveData.rslt.cr[0]);

      var urisOfNodesToMove = $.makeArray(jstreeMoveData.rslt.o.map(function(i, moved) {return $(moved).data("uri");}));

      var index = jstreeMoveData.rslt.cp;

      if ((jstreeMoveData.rslt.op == jstreeMoveData.rslt.np) &&
          (jstreeMoveData.rslt.cop < jstreeMoveData.rslt.cp)) {
        // We have moved a node downwards in the list.  Since the
        // list will shift up as the node is plucked out, we need to
        // adjust the target index for this.

        index -= jstreeMoveData.rslt.o.length;
      }

      var data_for_post = {
        children: urisOfNodesToMove,
        index: index
      };

      $.ajax({
        url: APP_PATH+targetNodeEl.attr("rel")+"s/"+targetNodeEl.data("id")+"/accept_children",
        type: "POST",
        data: data_for_post,
        success: function(data) {
          var $selected = getPrimarySelectedNode();

          // If the reparented record's form is open, update its hidden field.
          if (urisOfNodesToMove.indexOf($selected.data("uri")) >= 0) {
            var hiddenInput = $("input.hidden-parent-uri", $container);

            if (targetNodeEl.attr("rel") === $selected.attr("rel")) {
              hiddenInput.attr('name', $selected.attr("rel") + '[parent][ref]');
              hiddenInput.val(targetNodeEl.data("uri"));
            } else {
              hiddenInput.attr('name', $selected.attr("rel")+ '[parent]');
              hiddenInput.val(null);
            }
          }

          // Always update the currently selected node's position.. it may have changed!
          $("#"+$selected.attr("rel")+"_position_", $container).val($selected.index());

          // Also update the node's toolbar actions (as the move actions may have become out of sync)
          loadTreeActionsForNode($selected);
        },
        error: function(jqXHR, textStatus, errorThrown) {
          // Rollback the last move.
          $.jstree.rollback(jstreeMoveData.rlbk);

          // show a modal message
          AS.openQuickModal(AS.renderTemplate("tree_unable_to_move_message_template"), jqXHR.responseText);
        }
      });
    };

    var confirmChanges = function(targetNodeEl) {
      var parentIdFornew;
      if (targetNodeEl.attr("id") === "new") {
        parentIdFornew = targetNodeEl.parents("li:first").attr("id");
      }

      // open save your changes modal
      AS.openCustomModal("saveYourChangesModal", "Save Your Changes", AS.renderTemplate("save_changes_modal_template"));

      $("#saveChangesButton", "#saveYourChangesModal").on("click", function() {
        var $form = $("form", $container);

        $form.triggerHandler("submit");

        var onSubmitSuccess = function() {
          $form.data("form_changed", false);
          setHashForNode(targetNodeEl.attr("id"));
          $("#saveYourChangesModal").modal("hide");
        };

        var onSubmitError = function() {
          $("#saveYourChangesModal").modal("hide");
        };

        $container.one("submitted", function(event, data) {
          if (data.success) {
            onSubmitSuccess();
          } else {
            onSubmitError();
          }
        });
      });

      $("#dismissChangesButton", "#saveYourChangesModal").on("click", function() {
        $("form", $container).data("form_changed", false);
        if (targetNodeEl.attr("id") != "new") {
          $tree.jstree("delete_node", $('#new', $tree));
        }
        setHashForNode(targetNodeEl.attr("id"));
        $("#saveYourChangesModal").modal("hide");
      });

      $(".btn-cancel", "#saveYourChangesModal").on("click", function() {
        if (targetNodeEl.attr("id") === "new") {
          $tree.jstree("delete_node", $('#new', $tree));
        }
      });
    };

    AS.formatJSONForJSTree = function(node_json) {
      var node_id = node_json.node_type + "_" + node_json.id;
      var result = {
        data: {
          title: AS.renderTemplate("tree_node_template", {node: node_json}),
          attr: {
            href: "#tree::"+node_id,
            title: AS.encodeForAttribute(node_json.title)
          }
        },
        attr: {
          id: node_id,
          rel: node_json.node_type,
          "data-id": node_json.id,
          "data-uri": node_json.record_uri,
          "class": node_json.node_type
        }
      };

      if ($.inArray(node_id, initiallyOpenedNodes()) >= 0) {
        result.state = "open";
      }

      if (node_json.hasOwnProperty("children") && node_json.children.length > 0) {
        result.children = $.makeArray(node_json.children).map(function(child_id) {
          return AS.formatJSONForJSTree(AS.tree_data[child_id]);
        });
      } else if (node_json.has_children) {
        result.children = [];
      }

      return result;
    };

    var path_to_node;
    var initiallyOpenedNodes = function() {
      if (path_to_node) {
        return path_to_node;
      }
      if (location.hash) {
        var hash_id = location.hash.replace("tree::","");
        if (AS.tree_data.hasOwnProperty(hash_id.replace("#", ""))) {
          path_to_node = [];
          var node_id = hash_id.replace("#", "");
          while(true) {
            var node = AS.tree_data[node_id];
            path_to_node.push(node_id);
            if (node.hasOwnProperty("parent")) {
              node_id = node.parent;
            } else {
              path_to_node = path_to_node.reverse();
              path_to_node.pop();
              return path_to_node;
            }
          }
        }
      }
      return [];
    };

	$tree.unbind("move_node.jstree");
    $tree.bind("move_node.jstree", function(event, data) {
          moveNodes(data); 
      });
}
});
