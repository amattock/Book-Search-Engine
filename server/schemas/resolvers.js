const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');
// const { saveBook } = require('../controllers/user-controller');

const resolvers = {
    Query : {
        me: async (parent, args, context) => {
            if(context.user) {
                const userData = await User.findOne({_id: context.user._id})
                .select('-__v -password')
                .populate('orders')
                .populate({
                    path: 'orders.items',
                    populate: 'category'
                });
                return userData;
            }
            throw new AuthenticationError('Not logged in');
        }

    },

    Mutation: {
        addUser: async (parent, args) => {
            const user = await User.create(args);
            const token = signToken(user);
            return {token, user};
        }
    }
};

login: async (parent, {email, password, username}) => {
    try {
        const user = await User.findOne({ username, email});
        if(!user) {
            throw new AuthenticationError('Incorrect credentials');
        }
        const correctPw = await user.isCorrectPassword(password);
        if(!correctPw) {
            throw new AuthenticationError('Incorrect credentials');
        }
        const token = signToken(user);
        return {token, user};
    }
    catch (err) {
        console.log(err);
    }
}

saveBook: async (parent, {input}, context) => {
    if(context.user) {
        const updatedUser = await User.findByIdAndUpdate(
            {_id: context.user._id},
            {$push: {savedBooks: input}},
            {new: true}
        );
        return updatedUser;
    }
    throw new AuthenticationError('Please log in!');
}

removeBook: async (parent, {bookId}, context) => {
    const {user} = context;
    const updatedUser = await User.findOneAndUpdate(
        {_id: user._id},
        {$pull: {savedBooks: {bookId: bookId}}},
        {new: true}
    );
    if(!updatedUser) {
        throw new AuthenticationError("No user with this id!");
    }
    return updatedUser;
}

module.exports = resolvers;