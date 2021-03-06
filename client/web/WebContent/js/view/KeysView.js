define([
	'jquery',
	'underscore',
	'backbone',
	'text!templates/keysTemplate.html',
	'text!templates/keyListTemplate.html',
	'text!templates/keyListItemTemplate.html',

	'modelBinder',
], function ($,_,Backbone,keysViewTemplate, keyListViewTemplate, keyListViewItemTemplate) {
	
	KeyListViewItem = Backbone.View.extend({
		
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.appView = options.appView;
        	_.bindAll(this, 'render');
        },
          
        render: function( model ) {
        	var rendered = _.template(keyListViewItemTemplate, { model: this.model });
            this.$el.html(rendered);
            return this;
        },
        
	});
	
	KeyListView = Backbone.View.extend({
		
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.views = [];
        	_.bindAll(this, 'render', 'fetch', 'onFetch', 'onFetchFailure');

        	this.collection = appSingleton.user.getKeyRing();
        	this.fetch();
        },
        
        fetch: function()
        {
        	this.collection.fetch({
        		success: this.onFetch,
        		failure: this.onFetchFailure,
        	});
        },
        
        onFetch: function(models)
        {
        	this.render();
        },
        
        onFetchFailure: function()
        {
        	
        },
          
        render: function( model ) {
        	var rendered = _.template(keyListViewTemplate, { collection: this.collection });
            this.$el.html(rendered);
            
        	_.each(
        		this.collection.models,
        		
        		function(model) 
        		{
        			if (!_.has(this.views, model))
        			{
        				var view = new KeyListViewItem({ tagName: 'tr', model: model });
		                view.render();
		                
		                this.views[model.syncId] = view;
        			}
        			
        			var view = this.views[model.syncId];
        			view.delegateEvents();
	                this.$(".key-list-items").append(view.el);
            	}, 
            	
            	this
            );
            return this;
        },
        
	});
	
	KeysView = Backbone.View.extend({
		
        events: {
            'click .done' : 'onDone',
            'click .add' : 'onAdd',
        },
        
        initialize: function(options) 
        {
        	this.modelBinders = [];
        	this.appView = options.appView;
        	_.bindAll(this, 'onDone', 'onAdd');
        	this.keysListView = null;
        },
          
        onDone: function()
        {
        	
        },
        
        onAdd: function()
        {
        	var onFailure = function(error) {
    			that.$('.key-input').val('Unabled to parse key ' + error);
        	};
        	
        	var that = this;
        	var keyBlock = this.$('.key-input').val();
        	
        	// check it with the info
        	Crypto.infoPGP(keyBlock, {
        		success: function(info) {
        			that.$('.key-input').val('Key parsed..');
        			
        			appSingleton.user.getContacts().ensureContact(info.userId);        			
        			var crypto = appSingleton.user.getKeyRing().createKey(keyBlock, info);
					
					crypto.generateInfo('user', {
						success: function () {
							crypto.save();
							that.$('.key-input').val('Key saved..\n' + JSON.stringify(info));
						},
						failure: onFailure
					});

					
					crypto.once('sync', that.keysListView.fetch);
        		},
        		failure: onFailure,
        	});
        },

        render: function( model ) {
        	var rendered = _.template(keysViewTemplate, { model: this.model });
            this.$el.html(rendered);
            
            this.keysListView = new KeyListView({ el: this.$('.key-list') });
            
            this.$('#keys-modal').modal({ show: true });    
            return this;
        },
        
	});
	
});