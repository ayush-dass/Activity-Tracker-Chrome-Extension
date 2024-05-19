class UsersController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:signup, :login]

  def signup
    user = User.new(user_params)
    if user.save
      render json: { message: 'User created successfully' }
    else
      render json: { error: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def login
    user = User.find_by(email: params[:email])
    if user&.authenticate(params[:password])
      jwt_token = JWT.encode({ user_id: user.id }, Rails.application.credentials.dig(:jwt, :secret_key))
      render json: { token: jwt_token }
    else
      render json: { error: 'Invalid email or password' }, status: :unauthorized
    end
  end

  private

  def user_params
    params.require(:user).permit(:email, :password)
  end
end
