using System;

using Xamarin.Forms;

namespace CareXchange
{
    public class CareXchangePage : ContentPage
    {
        public CareXchangePage()
        {

            WebView webView = new WebView
            {
                Source = new UrlWebViewSource
                {
                    Url = "https://carexchange.hometreelab.com/",
                },
                VerticalOptions = LayoutOptions.FillAndExpand
            };

            // Build the page.
            this.Content = new StackLayout
            {
                Children =
                {
                    //header,
                    webView
                }
            };
        }
    }
}

