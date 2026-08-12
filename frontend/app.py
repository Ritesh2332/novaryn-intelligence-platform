import streamlit as st
import requests
import pandas as pd
import plotly.express as px

API_URL = "http://localhost:8000"

st.set_page_config(page_title="Novaryn AI", page_icon="🤖", layout="wide")

st.title("🤖 Novaryn Intelligence Platform")
st.markdown("Real-time news analysis and AI-powered insights.")

tab1, tab2, tab3, tab4 = st.tabs(["Dashboard", "Analytics", "News Feed", "AI Assistant"])

# --- Helper Functions ---
def fetch_data(endpoint):
    try:
        response = requests.get(f"{API_URL}{endpoint}")
        response.raise_for_status()
        return response.json()
    except Exception as e:
        st.error(f"Error fetching data from {endpoint}: {e}")
        return None

# --- TAB 1: Dashboard ---
with tab1:
    st.header("System Dashboard")
    
    col1, col2 = st.columns([1, 1])
    
    with col1:
        if st.button("🔄 Trigger News Ingestion"):
            with st.spinner("Fetching and processing news..."):
                res = fetch_data("/fetch-news")
                if res:
                    st.success(f"Ingestion successful! {res.get('message', '')}")
    
    st.subheader("Latest Articles")
    latest = fetch_data("/analytics/latest-articles")
    if latest:
        for article in latest[:5]:
            with st.expander(f"{article['title']} - ({article['source']})"):
                st.write(article['description'])
                st.caption(f"Sentiment: {article['sentiment']}")

# --- TAB 2: Analytics ---
with tab2:
    st.header("Advanced Analytics")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("Sentiment Distribution")
        sentiment_data = fetch_data("/analytics/sentiment-distribution")
        if sentiment_data:
            df = pd.DataFrame(sentiment_data)
            if not df.empty:
                fig = px.pie(df, values='count', names='sentiment', hole=0.4, 
                             color='sentiment',
                             color_discrete_map={'positive':'#00cc96', 'neutral':'#636efa', 'negative':'#ef553b'})
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No sentiment data available.")
                
    with col2:
        st.subheader("Top Sources")
        source_data = fetch_data("/analytics/top-sources")
        if source_data:
            df = pd.DataFrame(source_data)
            if not df.empty:
                fig = px.bar(df, x='source', y='count', color='source')
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No source data available.")

# --- TAB 3: News Feed ---
with tab3:
    st.header("Live News Feed")
    latest = fetch_data("/analytics/latest-articles")
    if latest:
        for article in latest:
            st.markdown(f"### {article['title']}")
            st.write(article['description'])
            st.markdown(f"**Source:** {article['source']} | **Sentiment:** `{article['sentiment']}`")
            st.divider()

# --- TAB 4: AI Assistant ---
with tab4:
    st.header("AI News Assistant (RAG)")
    st.markdown("Ask questions about the current news. The AI will search the database and generate a grounded answer.")
    
    query = st.text_input("Enter your question:")
    if st.button("Ask AI"):
        if query:
            with st.spinner("Searching and generating answer..."):
                res = fetch_data(f"/rag/ask?query={query}")
                if res and "answer" in res:
                    st.info(res["answer"])
                else:
                    st.error("Failed to generate answer.")
        else:
            st.warning("Please enter a question.")
