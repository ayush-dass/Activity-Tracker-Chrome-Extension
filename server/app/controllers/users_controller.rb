class UsersController < ApplicationController
  skip_before_action :verify_authenticity_token, only: [:signup, :login]

  def signup
    user = User.new(user_params)
    puts "Received signup request with parameters: #{user_params.inspect}"

    if user.save
      jwt_token = JWT.encode({ user_id: user.id }, Rails.application.credentials.dig(:jwt, :secret_key))
      response = { success: true, token: jwt_token, name: user.name, email: user.email }
      puts "Sending signup response: #{response.inspect}"
      render json: response, status: :created
    else
      response = { success: false, error: user.errors.full_messages }
      puts "Sending signup error response: #{response.inspect}"
      render json: response, status: :unprocessable_entity
    end
  end

  def login
    user = User.find_by(email: params[:email])
    puts "Received login request with parameters: #{params.inspect}"

    if user&.authenticate(params[:password])
      jwt_token = JWT.encode({ user_id: user.id }, Rails.application.credentials.dig(:jwt, :secret_key))
      response = { success: true, token: jwt_token, name: user.name, email: user.email }
      puts "Sending login response: #{response.inspect}"
      render json: response
    else
      response = { success: false, error: 'Invalid email or password' }
      puts "Sending login error response: #{response.inspect}"
      render json: response, status: :unauthorized
    end
  end

  private

  def user_params
    params.require(:user).permit(:name, :email, :password)
  end
end
