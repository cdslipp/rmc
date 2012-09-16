define(
['ext/backbone', 'ext/jquery', 'ext/underscore', 'ext/underscore.string',
'util'],
function(Backbone, $, _, _s, util) {

  var NUM_SEGMENTS = 5;
  // TODO(david): Refactor all the row-fluid to use an actual class name

  // A rating of a single metric
  var RatingModel = Backbone.Model.extend({
    defaults: {
      name: 'interest',
      count: 10,
      total: 7
    },

    getDisplayName: function() {
      return util.capitalize(this.get('name'));
    },

    getAverage: function() {
      // TODO(david) FIXME: Normalize all the numbers correctly
      return (this.get('total') / Math.max(1, this.get('count'))) * 0.8 + 0.2;
    },

    getPercent: function() {
      return this.getAverage() * 100;
    },

    getDisplayRating: function() {
      return _s.sprintf("%.1f", this.getAverage() * NUM_SEGMENTS);
    },

    // TODO(david): This shouldn't be here. Refactor this away.
    getClass: function() {
      return {
        'interest': 'progress-info',
        'easiness': 'progress-warning',
        'passion': 'progress-danger',
        'clarity': 'progress-success'
      }[this.get('name')];
    }
  });

  var RatingCollection = Backbone.Collection.extend({
    model: RatingModel,

    getNameAt: function(index) {
      return this.at(index).get('name');
    }

  });

  var RatingsView = Backbone.View.extend({

    events: {
      'mouseenter .rating-progress': 'onRatingHover',
      'mouseleave .input-rating': 'setUserRatings',
      'click .rating-progress': 'onRatingClick'
    },

    initialize: function(options) {
      this.ratings = options.ratings;
      this.userReviewModel = options.userReviewModel;
      this.userOnly = options.userOnly;

      this.userReviewModel.on('change', this.setUserRatings, this);
    },

    render: function() {
      var ratings = this.ratings;
      this.$el.html(_.template($('#ratings-tpl').html(), {
          ratings: ratings,
          userOnly: this.userOnly
      }));

      // Set the width here instead of in the template for animations
      this.$('.shown-rating .bar').each(function(i, elem) {
        $(elem).css('width', ratings.at(i).getPercent() + '%');
      });

      this.setUserRatings();

      return this;
    },

    setUserRatings: function() {
      var self = this;
      this.$('.input-rating').each(function(i, inputRating) {
        var name = self.ratings.getNameAt(i);
        var userRating = self.userReviewModel.getRating(name);
        var value = userRating ? userRating * NUM_SEGMENTS : 0;
        self.selectRating(inputRating, value);
      });
    },

    removeBars: function() {
      this.$('.bar').remove();
    },

    // TODO(david): Refactor to use single model+view for each rating
    onRatingHover: function(evt) {
      this.setUserRatings();

      var $target = $(evt.currentTarget);
      var $rowElem = $target.closest('.row-fluid');
      var value = $target.index() + 1;
      this.selectRating($rowElem.find('.input-rating'), value);
    },

    selectRating: function(inputRatingElem, value) {
      var numberValue = value === 0 ? '' : value;
      $(inputRatingElem)
        .find('.rating-bar').each(function(i, elem) {
          $(elem).toggleClass('bar', i < value).css('opacity', '');
        })
        .closest('.row-fluid').find('.input-rating-num').text(numberValue);
    },

    onRatingClick: function(evt) {
      var $target = $(evt.currentTarget);
      var index = $target.closest('.row-fluid').index();
      var name = this.ratings.getNameAt(index);
      var value = ($target.index() + 1) / NUM_SEGMENTS;
      this.userReviewModel.setRating(name, value);
      $target.parent().find('.bar').css('opacity', 1.0);
    }

  });

  return {
    RatingModel: RatingModel,
    RatingCollection: RatingCollection,
    RatingsView: RatingsView
  };

});